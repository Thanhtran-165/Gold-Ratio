import { NextRequest, NextResponse } from 'next/server';
import { RATIOS } from '@/config/ratios';
import { INSTRUMENTS } from '@/config/universe';
import { tryMultipleSymbols } from '@/lib/providers/yahoo';
import { getFredSeries } from '@/lib/providers/fred';
import { tryMSNFetch } from '@/lib/providers/msn';
import { getBinanceHistorical } from '@/lib/providers/binance';
import { toDailyFFill, intersect, computeRatio, indexToWindowStart } from '@/lib/series/align';
import { getWindowStartDate } from '@/lib/utils';
import { calculateStats } from '@/lib/math/stats';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ratioId = searchParams.get('id');
    const window = (searchParams.get('window') || '3Y') as any;
    const fredApiKey = request.headers.get('x-fred-api-key');

    if (!ratioId) {
      return NextResponse.json(
        { error: 'Ratio ID is required' },
        { status: 400 }
      );
    }

    const ratio = RATIOS[ratioId];
    if (!ratio) {
      return NextResponse.json(
        { error: 'Ratio not found' },
        { status: 404 }
      );
    }

    if (ratio.requiresFred && !fredApiKey) {
      return NextResponse.json({
        error: 'FRED API key required for this ratio',
        locked: true,
      });
    }

    const startDate = getWindowStartDate(window);
    const endDate = new Date();

    const numeratorInstr = INSTRUMENTS[ratio.computeSpec.numerator];
    const denominatorInstr = INSTRUMENTS[ratio.computeSpec.denominator];

    if (!numeratorInstr || !denominatorInstr) {
      return NextResponse.json(
        { error: 'Invalid ratio configuration' },
        { status: 500 }
      );
    }

    let numeratorData: any[] = [];
    let denominatorData: any[] = [];

    for (const provider of numeratorInstr.providerPriority) {
      if (provider === 'YAHOO' && numeratorInstr.yahooSymbols) {
        const result = await tryMultipleSymbols(numeratorInstr.yahooSymbols, startDate, endDate);
        if (result.data.length > 0) {
          numeratorData = result.data;
          break;
        }
      } else if (provider === 'FRED' && numeratorInstr.fredSeries && fredApiKey) {
        const fredData = await getFredSeries(numeratorInstr.fredSeries, fredApiKey, startDate, endDate);
        if (fredData.length > 0) {
          numeratorData = toDailyFFill(fredData);
          break;
        }
      } else if (provider === 'BINANCE' && numeratorInstr.binanceSymbol) {
        const binanceData = await getBinanceHistorical(numeratorInstr.binanceSymbol, startDate, endDate);
        if (binanceData.length > 0) {
          numeratorData = binanceData;
          break;
        }
      } else if (provider === 'MSN') {
        const msnResult = await tryMSNFetch(numeratorInstr.msnQuery ?? numeratorInstr.name, startDate, endDate);
        if (msnResult.available && msnResult.data.length > 0) {
          numeratorData = msnResult.data;
          break;
        }
      }
    }

    for (const provider of denominatorInstr.providerPriority) {
      if (provider === 'YAHOO' && denominatorInstr.yahooSymbols) {
        const result = await tryMultipleSymbols(denominatorInstr.yahooSymbols, startDate, endDate);
        if (result.data.length > 0) {
          denominatorData = result.data;
          break;
        }
      } else if (provider === 'FRED' && denominatorInstr.fredSeries && fredApiKey) {
        const fredData = await getFredSeries(denominatorInstr.fredSeries, fredApiKey, startDate, endDate);
        if (fredData.length > 0) {
          denominatorData = toDailyFFill(fredData);
          break;
        }
      } else if (provider === 'BINANCE' && denominatorInstr.binanceSymbol) {
        const binanceData = await getBinanceHistorical(denominatorInstr.binanceSymbol, startDate, endDate);
        if (binanceData.length > 0) {
          denominatorData = binanceData;
          break;
        }
      } else if (provider === 'MSN') {
        const msnResult = await tryMSNFetch(denominatorInstr.msnQuery ?? denominatorInstr.name, startDate, endDate);
        if (msnResult.available && msnResult.data.length > 0) {
          denominatorData = msnResult.data;
          break;
        }
      }
    }

    if (numeratorData.length === 0 || denominatorData.length === 0) {
      return NextResponse.json({
        error: 'Insufficient data to compute ratio',
        data: [],
        stats: null,
      });
    }

    if (ratio.computeSpec.indexedToWindow) {
      denominatorData = indexToWindowStart(denominatorData, ratio.computeSpec.indexedToWindowBase ?? 100);
    }

    const [alignedNum, alignedDen] = intersect(numeratorData, denominatorData);
    const ratioSeries = computeRatio(alignedNum, alignedDen, ratio.computeSpec.operation);

    if (ratioSeries.length === 0) {
      return NextResponse.json({
        error: 'No overlapping data to compute ratio',
        data: [],
        stats: null,
      });
    }

    const values = ratioSeries.map(d => d.value);
    const latestValue = values[values.length - 1];
    const stats = calculateStats(values, latestValue);

    return NextResponse.json({
      data: ratioSeries,
      stats: {
        latest: latestValue,
        min: stats.min,
        max: stats.max,
        median: stats.median,
        mean: stats.mean,
        std: stats.std,
        percentile: stats.percentile,
        zScore: stats.zScore,
      },
      count: ratioSeries.length,
    });
  } catch (error) {
    console.error('Ratio API error:', error);
    return NextResponse.json(
      { error: 'Failed to compute ratio', data: [], stats: null },
      { status: 500 }
    );
  }
}
