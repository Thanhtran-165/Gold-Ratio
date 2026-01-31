import { serverCache } from '../cache';

const CACHE_TTL = 6 * 60 * 60 * 1000;
const QUOTE_CACHE_TTL = 60 * 1000; // 1 minute for quotes
const MSN_ONE_SERVICE_BASE_URL = 'https://assets.msn.com/service/';
const MSN_DEFAULT_OCID = process.env.MSN_ONE_SERVICE_OCID || 'Peregrine';
const MSN_DEFAULT_MARKET = process.env.MSN_ONE_SERVICE_MARKET || 'en-us';
// Extracted from the public MSN Finance web bundle; override via env if it changes.
const MSN_DEFAULT_API_KEY =
  process.env.MSN_ONE_SERVICE_API_KEY || '1hYoJsIRvPEnSkk0hlnJF2092mHqiz7xFenIFKa9uc';

export interface MSNQuote {
  symbol: string;
  regularMarketPrice: number | null;
  previousClose: number | null;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
}

function getQueryCandidates(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === 'gold spot') return ['Gold', query];
  if (normalized === 'silver spot') return ['Silver', query];

  const compactPair = query.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (compactPair.length === 6 && compactPair !== query) {
    return [compactPair, query];
  }

  return [query];
}

function toFiniteNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(num) ? num : null;
}

function isPlausiblePreviousClose(price: number, previousClose: number) {
  if (!Number.isFinite(price) || !Number.isFinite(previousClose)) return false;
  if (previousClose <= 0) return false;
  const ratio = previousClose / price;
  return ratio > 0.1 && ratio < 10;
}

function buildOneServiceUrl(path: string, searchParams: Record<string, string | undefined>) {
  const url = new URL(path.replace(/^\//, ''), MSN_ONE_SERVICE_BASE_URL);
  url.searchParams.set('ocid', MSN_DEFAULT_OCID);
  url.searchParams.set('apikey', MSN_DEFAULT_API_KEY);
  url.searchParams.set('market', MSN_DEFAULT_MARKET);

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  return url;
}

export async function getMSNQuote(query: string): Promise<MSNQuote | null> {
  const cacheKey = 'msn:quote:' + query;
  const cached = serverCache.get<MSNQuote>(cacheKey);
  if (cached) return cached;

  try {
    for (const candidate of getQueryCandidates(query)) {
      const stockId = await msnAutosuggest(candidate);
      if (!stockId) continue;

      const url = buildOneServiceUrl('Finance/Quotes', {
        ids: stockId,
        wrapodata: 'false',
      });

      const response = await fetch(url);
      if (!response.ok) continue;

      const quotes: any = await response.json();
      const first = Array.isArray(quotes) && quotes.length > 0 ? quotes[0] : null;
      if (!first) continue;

      const price = toFiniteNumber(first.price);
      const change = toFiniteNumber(first.priceChange);
      const changePercent = toFiniteNumber(first.priceChangePercent);
      const securityType = typeof first.securityType === 'string' ? first.securityType.toLowerCase() : '';

      let previousClose = toFiniteNumber(first.pricePreviousClose);
      if (price !== null) {
        // Some crypto entries return `pricePreviousClose` as the same value as `priceChangePercent`.
        if (securityType.includes('crypto')) {
          if (change !== null) {
            previousClose = price - change;
          } else if (changePercent !== null) {
            previousClose = price / (1 + changePercent / 100);
          } else if (previousClose !== null && !isPlausiblePreviousClose(price, previousClose)) {
            previousClose = null;
          }
        } else if (previousClose !== null && !isPlausiblePreviousClose(price, previousClose)) {
          if (change !== null) {
            previousClose = price - change;
          } else if (changePercent !== null) {
            previousClose = price / (1 + changePercent / 100);
          }
        } else if (previousClose === null) {
          if (change !== null) {
            previousClose = price - change;
          } else if (changePercent !== null) {
            previousClose = price / (1 + changePercent / 100);
          }
        }
      }

      if (price !== null) {
        const quote: MSNQuote = {
          symbol: first.symbol || candidate,
          regularMarketPrice: price,
          previousClose,
          regularMarketChange: change ?? (price !== null && previousClose !== null ? price - previousClose : null),
          regularMarketChangePercent:
            changePercent ??
            (price !== null && previousClose !== null && previousClose !== 0 ? ((price - previousClose) / previousClose) * 100 : null),
        };

        serverCache.set(cacheKey, quote, QUOTE_CACHE_TTL);
        return quote;
      }
    }

    return null;
  } catch (error) {
    console.error('MSN quote error for ' + query + ':', error);
    return null;
  }
}

export async function msnAutosuggest(query: string): Promise<string | null> {
  const cacheKey = 'msn:autosuggest:' + query;
  const cached = serverCache.get<string>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL('https://services.bingapis.com/contentservices-finance.csautosuggest/api/v1/Query');
    url.searchParams.append('query', query);
    url.searchParams.append('market', MSN_DEFAULT_MARKET);
    url.searchParams.append('count', '1');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error('MSN autosuggest error: ' + response.status);
    }

    const data: any = await response.json();

    // Parse the stocks array - data is returned as JSON strings
    const stocksArray = data.data?.stocks;
    if (!stocksArray || stocksArray.length === 0) {
      return null;
    }

    // Parse the first stock JSON string
    const stockData = typeof stocksArray[0] === 'string'
      ? JSON.parse(stocksArray[0])
      : stocksArray[0];

    const stockId = stockData.SecId || stockData.stockId;

    if (stockId) {
      serverCache.set(cacheKey, stockId, CACHE_TTL);
      return stockId;
    }

    return null;
  } catch (error) {
    console.error('MSN autosuggest error:', error);
    return null;
  }
}

export async function msnChartTimeRange(
  stockId: string,
  startDate: Date,
  endDate: Date
): Promise<{ data: any[]; available: boolean }> {
  const cacheKey =
    'msn:chart:timerange:' +
    stockId +
    ':' +
    startDate.toISOString().split('T')[0] +
    ':' +
    endDate.toISOString().split('T')[0];
  const cached = serverCache.get<any[]>(cacheKey);
  if (cached) return { data: cached, available: true };

  try {
    const url = buildOneServiceUrl('Finance/Charts/TimeRange', {
      ids: stockId,
      timeframe: '1', // daily
      StartTime: startDate.toISOString(),
      EndTime: endDate.toISOString(),
    });

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('MSN Charts/TimeRange error: ' + response.status);
    }

    const data: any = await response.json();
    const entry = Array.isArray(data?.value) && data.value.length > 0 ? data.value[0] : null;
    const series = entry?.series;
    const timestamps: unknown = series?.timeStamps;
    const prices: unknown = series?.prices;

    if (Array.isArray(timestamps) && Array.isArray(prices) && timestamps.length === prices.length) {
      const dataPoints = timestamps
        .map((ts: any, idx: number) => ({
          date: typeof ts === 'string' ? ts.split('T')[0] : null,
          value: toFiniteNumber(prices[idx]),
        }))
        .filter((dp: any) => typeof dp.date === 'string' && dp.value !== null);

      if (dataPoints.length > 0) {
        serverCache.set(cacheKey, dataPoints, CACHE_TTL);
        return { data: dataPoints, available: true };
      }
    }

    return { data: [], available: false };
  } catch (error) {
    console.error('MSN Charts/TimeRange error:', error);
    return { data: [], available: false };
  }
}

export async function tryMSNFetch(symbolOrName: string, startDate: Date, endDate: Date) {
  try {
    for (const candidate of getQueryCandidates(symbolOrName)) {
      const stockId = await msnAutosuggest(candidate);
      if (!stockId) continue;

      const result = await msnChartTimeRange(stockId, startDate, endDate);
      if (result.available && result.data.length > 0) {
        return result;
      }
    }

    return { data: [], available: false };
  } catch (error) {
    console.error('MSN fetch error:', error);
    return { data: [], available: false };
  }
}
