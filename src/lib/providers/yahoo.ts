import yahooFinance from 'yahoo-finance2';
import { serverCache } from '../cache';

export interface YahooQuote {
  symbol: string;
  regularMarketPrice: number | null;
  previousClose: number | null;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
}

const QUOTE_CACHE_TTL = 60 * 1000;
const HISTORY_CACHE_TTL = 6 * 60 * 60 * 1000;

function toFiniteNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(num) ? num : null;
}

function computeChange(price: number | null, prev: number | null) {
  if (price === null || prev === null) {
    return { change: null, changePercent: null };
  }
  const change = price - prev;
  if (prev === 0) {
    return { change, changePercent: null };
  }
  return { change, changePercent: (change / prev) * 100 };
}

export async function getYahooQuote(symbols: string[]): Promise<Record<string, YahooQuote | null>> {
  const cacheKey = 'yahoo:quote:' + symbols.join(',');
  const cached = serverCache.get<Record<string, YahooQuote | null>>(cacheKey);
  if (cached) return cached;

  const result: Record<string, YahooQuote | null> = {};

  try {
    for (const symbol of symbols) {
      try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 10 * 24 * 60 * 60 * 1000);

        const chart: any = await yahooFinance.chart(symbol, {
          period1: startDate,
          period2: endDate,
          interval: '1d',
        });

        const meta = chart?.meta;
        let regularMarketPrice =
          toFiniteNumber(meta?.regularMarketPrice) ??
          toFiniteNumber(meta?.postMarketPrice) ??
          toFiniteNumber(meta?.preMarketPrice);
        let previousClose = toFiniteNumber(meta?.previousClose) ?? toFiniteNumber(meta?.chartPreviousClose);

        const closes = Array.isArray(chart?.quotes)
          ? chart.quotes
              .map((q: any) => toFiniteNumber(q?.adjclose) ?? toFiniteNumber(q?.close))
              .filter((n: any) => n !== null)
          : [];

        if (regularMarketPrice === null && closes.length > 0) {
          regularMarketPrice = closes[closes.length - 1] ?? null;
        }
        if (previousClose === null && closes.length > 1) {
          previousClose = closes[closes.length - 2] ?? null;
        }

        const { change, changePercent } = computeChange(regularMarketPrice, previousClose);

        result[symbol] = {
          symbol,
          regularMarketPrice,
          previousClose,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
        };
      } catch (e) {
        console.error('Failed to fetch quote for ' + symbol + ':', e);
        result[symbol] = null;
      }
    }
  } catch (error) {
    console.error('Yahoo quote error:', error);
  }

  serverCache.set(cacheKey, result, QUOTE_CACHE_TTL);
  return result;
}

export async function getYahooHistorical(symbol: string, startDate: Date, endDate: Date = new Date()) {
  const cacheKey =
    'yahoo:history:' +
    symbol +
    ':' +
    startDate.toISOString().split('T')[0] +
    ':' +
    endDate.toISOString().split('T')[0];
  const cached = serverCache.get<any>(cacheKey);
  if (cached) return cached;

  try {
    const chart: any = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    const quotes = Array.isArray(chart?.quotes) ? chart.quotes : [];
    const dataPoints = quotes
      .map((q: any) => ({
        date:
          q?.date instanceof Date
            ? q.date.toISOString().split('T')[0]
            : typeof q?.date === 'string'
              ? q.date.split('T')[0]
              : null,
        value: toFiniteNumber(q?.adjclose) ?? toFiniteNumber(q?.close),
      }))
      .filter((dp: any) => typeof dp.date === 'string' && dp.value !== null);

    serverCache.set(cacheKey, dataPoints, HISTORY_CACHE_TTL);
    return dataPoints;
  } catch (error) {
    console.error('Yahoo history error:', error);
    return [];
  }
}

export async function tryMultipleSymbols(symbols: string[], startDate: Date, endDate: Date) {
  for (const symbol of symbols) {
    try {
      const data = await getYahooHistorical(symbol, startDate, endDate);
      if (data.length > 0) {
        return { symbol, data };
      }
    } catch (error) {
      console.error('Failed for ' + symbol + ':', error);
      continue;
    }
  }

  return { symbol: null, data: [] };
}
