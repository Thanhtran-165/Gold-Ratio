import { serverCache } from '../cache';

const HISTORY_CACHE_TTL = 6 * 60 * 60 * 1000;

export async function getFredSeries(seriesId: string, apiKey: string, startDate?: Date, endDate?: Date) {
  const cacheKey =
    'fred:series:' +
    seriesId +
    ':' +
    (startDate ? startDate.toISOString().split('T')[0] : '') +
    ':' +
    (endDate ? endDate.toISOString().split('T')[0] : '');
  const cached = serverCache.get<any>(cacheKey);
  if (cached) return cached;

  const url = new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.append('series_id', seriesId);
  url.searchParams.append('api_key', apiKey);
  url.searchParams.append('file_type', 'json');

  if (startDate) {
    url.searchParams.append('observation_start', startDate.toISOString().split('T')[0]);
  }
  if (endDate) {
    url.searchParams.append('observation_end', endDate.toISOString().split('T')[0]);
  }

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error('FRED API error: ' + response.status);
    }

    const data = await response.json();

    const dataPoints = (data.observations || [])
      .filter((obs: any) => obs.value !== '.')
      .map((obs: any) => ({
        date: obs.date,
        value: parseFloat(obs.value),
      }))
      .filter((dp: any) => !isNaN(dp.value));

    serverCache.set(cacheKey, dataPoints, HISTORY_CACHE_TTL);
    return dataPoints;
  } catch (error) {
    console.error('FRED series error:', error);
    return [];
  }
}

export async function pingFred(apiKey: string): Promise<boolean> {
  try {
    const url = new URL('https://api.stlouisfed.org/fred/series');
    url.searchParams.append('series_id', 'DGS10');
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('file_type', 'json');

    const response = await fetch(url.toString());
    return response.ok;
  } catch (error) {
    console.error('FRED ping error:', error);
    return false;
  }
}
