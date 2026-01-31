import { NextRequest, NextResponse } from 'next/server';
import { getYahooQuote } from '@/lib/providers/yahoo';
import { getMSNQuote } from '@/lib/providers/msn';
import { getBinanceQuote } from '@/lib/providers/binance';
import { getFredSeries } from '@/lib/providers/fred';
import { getAllMockQuotes } from '@/lib/providers/mock';
import { INSTRUMENTS } from '@/config/universe';
import { getWindowStartDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const fredApiKey = request.headers.get('x-fred-api-key');
    const useMock = request.headers.get('x-use-mock') === 'true';
    const results: Record<string, any> = {};

    // Use mock data if requested
    if (useMock) {
      return NextResponse.json(getAllMockQuotes());
    }

    // Process each instrument according to its provider priority
    for (const instrument of Object.values(INSTRUMENTS)) {
      let quote = null;

      // Skip FRED-only instruments for now (processed separately)
      if (instrument.providerPriority.includes('FRED') && instrument.providerPriority.length === 1) {
        continue;
      }

      // Try each provider in priority order
      for (const provider of instrument.providerPriority) {
        if (provider === 'MSN') {
          try {
            quote = await getMSNQuote(instrument.msnQuery ?? instrument.name);
            if (quote) {
              break;
            }
          } catch (e) {
            console.error('MSN quote failed for ' + instrument.id + ':', e);
          }
        } else if (provider === 'BINANCE' && instrument.binanceSymbol) {
          try {
            quote = await getBinanceQuote(instrument.binanceSymbol);
            if (quote) {
              break;
            }
          } catch (e) {
            console.error('Binance quote failed for ' + instrument.id + ':', e);
          }
        } else if (provider === 'YAHOO' && instrument.yahooSymbols) {
          try {
            // Try each Yahoo symbol in order
            for (const symbol of instrument.yahooSymbols) {
              const yahooQuotes = await getYahooQuote([symbol]);
              if (yahooQuotes[symbol]) {
                quote = yahooQuotes[symbol];
                break;
              }
            }
            if (quote) break;
          } catch (e) {
            console.error('Yahoo quote failed for ' + instrument.id + ':', e);
          }
        }
      }

      results[instrument.id] = quote;
    }

    // Process FRED instruments separately
    const fredInstruments = Object.values(INSTRUMENTS).filter(
      i => i.providerPriority.includes('FRED') && i.providerPriority.length === 1
    );

    if (fredInstruments.length > 0 && fredApiKey) {
      const endDate = new Date();
      const startDate = getWindowStartDate('1M');

      for (const instrument of fredInstruments) {
        try {
          const data = await getFredSeries(instrument.fredSeries!, fredApiKey, startDate, endDate);
          if (data.length > 0) {
            const latest = data[data.length - 1];
            const previous = data.length > 1 ? data[data.length - 2] : latest;

            results[instrument.id] = {
              symbol: instrument.id,
              regularMarketPrice: latest.value,
              previousClose: previous.value,
              regularMarketChange: latest.value - previous.value,
              regularMarketChangePercent: ((latest.value - previous.value) / previous.value) * 100,
            };
          } else {
            results[instrument.id] = null;
          }
        } catch (error) {
          console.error('FRED quote error for ' + instrument.id + ':', error);
          results[instrument.id] = null;
        }
      }
    } else if (fredInstruments.length > 0 && !fredApiKey) {
      fredInstruments.forEach(instrument => {
        results[instrument.id] = { locked: true };
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Quotes API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}
