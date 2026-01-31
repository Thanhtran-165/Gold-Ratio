import { NextRequest, NextResponse } from 'next/server';
import { INSTRUMENTS } from '@/config/universe';
import { tryMultipleSymbols } from '@/lib/providers/yahoo';
import { getFredSeries } from '@/lib/providers/fred';
import { tryMSNFetch } from '@/lib/providers/msn';
import { getBinanceHistorical } from '@/lib/providers/binance';
import { toDailyFFill } from '@/lib/series/align';
import { getWindowStartDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const instrumentId = searchParams.get('instrumentId');
    const window = (searchParams.get('window') || '3M') as any;
    const fredApiKey = request.headers.get('x-fred-api-key');

    if (!instrumentId) {
      return NextResponse.json(
        { error: 'instrumentId is required' },
        { status: 400 }
      );
    }

    const instrument = INSTRUMENTS[instrumentId];
    if (!instrument) {
      return NextResponse.json(
        { error: 'Instrument not found' },
        { status: 404 }
      );
    }

    const startDate = getWindowStartDate(window);
    const endDate = new Date();
    let data: any[] = [];
    let source = '';

    if (instrument.providerPriority.includes('FRED') && !fredApiKey) {
      return NextResponse.json({
        error: 'FRED API key required',
        locked: true,
      });
    }

    for (const provider of instrument.providerPriority) {
      if (provider === 'YAHOO' && instrument.yahooSymbols) {
        const result = await tryMultipleSymbols(instrument.yahooSymbols, startDate, endDate);
        if (result.data.length > 0) {
          data = result.data;
          source = result.symbol || instrument.yahooSymbols[0];
          break;
        }
      } else if (provider === 'FRED' && instrument.fredSeries && fredApiKey) {
        const fredData = await getFredSeries(instrument.fredSeries, fredApiKey, startDate, endDate);
        if (fredData.length > 0) {
          data = toDailyFFill(fredData);
          source = instrument.fredSeries;
          break;
        }
      } else if (provider === 'BINANCE' && instrument.binanceSymbol) {
        const binanceData = await getBinanceHistorical(instrument.binanceSymbol, startDate, endDate);
        if (binanceData.length > 0) {
          data = binanceData;
          source = 'BINANCE';
          break;
        }
      } else if (provider === 'MSN') {
        const msnResult = await tryMSNFetch(instrument.msnQuery ?? instrument.name, startDate, endDate);
        if (msnResult.available && msnResult.data.length > 0) {
          data = msnResult.data;
          source = 'MSN';
          break;
        }
      }
    }

    if (data.length === 0) {
      return NextResponse.json({
        error: 'No data available',
        data: [],
        source: null,
      });
    }

    return NextResponse.json({
      data,
      source,
      count: data.length,
    });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data', data: [] },
      { status: 500 }
    );
  }
}
