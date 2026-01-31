'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Lock } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { CardSkeleton } from './Skeletons';
import { TickerDetailModal } from './TickerDetailModal';
import { INSTRUMENTS } from '@/config/universe';
import { formatPercent, formatPrice } from '@/lib/utils';

interface TickerGridProps {
  initialData?: any;
  fredKey: string | null;
}

interface QuoteData {
  regularMarketPrice: number | null;
  previousClose: number | null;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  locked?: boolean;
}

export function TickerGrid({ initialData, fredKey }: TickerGridProps) {
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>(initialData || {});
  const [loading, setLoading] = useState(!initialData);
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!initialData) {
      fetchQuotes();
    }
  }, [fredKey]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quotes', {
        headers: {
          'x-fred-api-key': fredKey || '',
        },
      });
      const data = await response.json();
      setQuotes(data);
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (instrumentId: string) => {
    const instrument = INSTRUMENTS[instrumentId];
    if (!instrument) return;

    // Check if FRED required
    if (instrument.providerPriority.includes('FRED') && !fredKey) {
      return; // Could show a toast here
    }

    setSelectedInstrument(instrumentId);
    setShowDetail(true);
  };

  const instruments = Object.values(INSTRUMENTS);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {instruments.map((inst) => (
          <CardSkeleton key={inst.id} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {instruments.map((instrument) => {
          const quote = quotes[instrument.id];
          const isLocked = quote?.locked || (instrument.providerPriority.includes('FRED') && !fredKey);
          const price = quote?.regularMarketPrice;
          const change = quote?.regularMarketChange;
          const changePercent = quote?.regularMarketChangePercent;

          return (
            <GlassCard
              key={instrument.id}
              onClick={() => !isLocked && handleCardClick(instrument.id)}
              hover={!isLocked}
              className={`relative ${isLocked ? 'opacity-60' : ''}`}
            >
              {isLocked && (
                <div className="absolute top-3 right-3 text-amber-500/70">
                  <Lock className="w-4 h-4" />
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white/90">{instrument.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                      {instrument.type}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">{instrument.id}</p>
                </div>

                <div className="space-y-1">
                  {isLocked ? (
                    <div className="text-amber-400/80 text-sm">Requires FRED API key</div>
                  ) : price !== null && price !== undefined ? (
                    <>
                      <div className="text-2xl font-bold text-white/90">
                        {formatPrice(price)}
                      </div>
                      {change !== null && changePercent !== null && (
                        <div className="flex items-center gap-1 text-sm">
                          {change >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-rose-400" />
                          )}
                          <span className={change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {formatPercent(changePercent)}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-white/40 text-sm">No data</div>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {selectedInstrument && (
        <TickerDetailModal
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedInstrument(null);
          }}
          instrumentId={selectedInstrument}
          fredKey={fredKey}
        />
      )}
    </>
  );
}
