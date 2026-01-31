import { serverCache } from '../cache';

const QUOTE_CACHE_TTL = 60 * 1000; // 1 minute
const HISTORY_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const BINANCE_BASE_URL = (process.env.BINANCE_API_BASE_URL || 'https://api.binance.com').replace(/\/+$/, '');

export interface BinanceQuote {
  symbol: string;
  regularMarketPrice: number | null;
  previousClose: number | null;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
}

function toFiniteNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(num) ? num : null;
}

function toDateOnly(date: Date) {
  return date.toISOString().split('T')[0];
}

function buildUrl(path: string, searchParams: Record<string, string | undefined>) {
  const url = new URL(path.replace(/^\//, ''), BINANCE_BASE_URL + '/');
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url;
}

export async function getBinanceQuote(symbol: string): Promise<BinanceQuote | null> {
  const cacheKey = `binance:quote:${symbol}`;
  const cached = serverCache.get<BinanceQuote>(cacheKey);
  if (cached) return cached;

  try {
    const url = buildUrl('/api/v3/ticker/24hr', { symbol });
    const response = await fetch(url);
    if (!response.ok) return null;

    const data: any = await response.json();

    const price = toFiniteNumber(data?.lastPrice);
    const change = toFiniteNumber(data?.priceChange);
    const changePercent = toFiniteNumber(data?.priceChangePercent);

    // Binance 24h ticker's `prevClosePrice` is sometimes confusing; derive a consistent previousClose.
    const previousClose = price !== null && change !== null ? price - change : toFiniteNumber(data?.prevClosePrice);

    const quote: BinanceQuote = {
      symbol: String(data?.symbol || symbol),
      regularMarketPrice: price,
      previousClose,
      regularMarketChange: change ?? (price !== null && previousClose !== null ? price - previousClose : null),
      regularMarketChangePercent:
        changePercent ??
        (price !== null && previousClose !== null && previousClose !== 0 ? ((price - previousClose) / previousClose) * 100 : null),
    };

    serverCache.set(cacheKey, quote, QUOTE_CACHE_TTL);
    return quote;
  } catch (error) {
    console.error('Binance quote error for ' + symbol + ':', error);
    return null;
  }
}

export async function getBinanceHistorical(symbol: string, startDate: Date, endDate: Date = new Date()) {
  const cacheKey = `binance:history:${symbol}:${toDateOnly(startDate)}:${toDateOnly(endDate)}`;
  const cached = serverCache.get<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const endTime = endDate.getTime();
    let startTime = startDate.getTime();

    const dataPoints: Array<{ date: string; value: number }> = [];
    const maxPages = 200;

    for (let page = 0; page < maxPages && startTime < endTime; page++) {
      const url = buildUrl('/api/v3/klines', {
        symbol,
        interval: '1d',
        startTime: String(startTime),
        endTime: String(endTime),
        limit: '1000',
      });

      const response = await fetch(url);
      if (!response.ok) break;

      const klines: any = await response.json();
      if (!Array.isArray(klines) || klines.length === 0) break;

      for (const kline of klines) {
        const openTime = typeof kline?.[0] === 'number' ? kline[0] : null;
        const close = toFiniteNumber(kline?.[4]);
        if (openTime === null || close === null) continue;

        dataPoints.push({
          date: new Date(openTime).toISOString().split('T')[0],
          value: close,
        });
      }

      const last = klines[klines.length - 1];
      const lastCloseTime = typeof last?.[6] === 'number' ? last[6] : null;
      if (lastCloseTime === null) break;

      const nextStart = lastCloseTime + 1;
      if (nextStart <= startTime) break;
      startTime = nextStart;
    }

    if (dataPoints.length > 0) {
      serverCache.set(cacheKey, dataPoints, HISTORY_CACHE_TTL);
    }

    return dataPoints;
  } catch (error) {
    console.error('Binance history error for ' + symbol + ':', error);
    return [];
  }
}

