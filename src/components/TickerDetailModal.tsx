'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from './GlassCard';
import { ChartSkeleton } from './Skeletons';
import { INSTRUMENTS } from '@/config/universe';
import { formatPrice, formatDate, TimeWindow } from '@/lib/utils';
import { clientCache } from '@/lib/cache';

interface TickerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrumentId: string;
  fredKey: string | null;
}

const TIME_WINDOWS: TimeWindow[] = ['1M', '3M', '6M', '1Y', 'MAX'];

export function TickerDetailModal({
  isOpen,
  onClose,
  instrumentId,
  fredKey,
}: TickerDetailModalProps) {
  const [window, setWindow] = useState<TimeWindow>('3M');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string | null>(null);
  const instrument = INSTRUMENTS[instrumentId];

  useEffect(() => {
    if (isOpen && instrument) {
      fetchData();
    }
  }, [isOpen, window, instrumentId, fredKey]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cacheKey = clientCache.generateKey(['history', instrumentId, window]);
      const cached = clientCache.get<any>(cacheKey);

      if (cached) {
        setData(cached.data);
        setSource(cached.source);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/history?instrumentId=${instrumentId}&window=${window}`,
        {
          headers: fredKey ? { 'x-fred-api-key': fredKey } : {},
        }
      );

      const result = await response.json();

      if (result.error) {
        setData([]);
        setSource(null);
      } else {
        const chartData = result.data.map((d: any) => ({
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: d.value,
        }));

        setData(chartData);
        setSource(result.source);

        // Cache for 1 hour
        clientCache.set(cacheKey, { data: chartData, source: result.source }, 60 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setData([]);
      setSource(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !instrument) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <GlassCard className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn z-10">
        <div className="sticky top-0 bg-inherit backdrop-blur-xl z-10 pb-4 border-b border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white/90 mb-1">{instrument.name}</h2>
              <p className="text-sm text-white/50">{instrument.id} • {instrument.type}</p>
              {source && (
                <p className="text-xs text-white/30 mt-1">Source: {source}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {TIME_WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  window === w
                    ? 'bg-amber-600/80 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <ChartSkeleton />
          ) : data.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickFormatter={(value) => value.toFixed(2)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    formatter={(value: any) => [formatPrice(value), 'Price']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="url(#gradient)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#eab308" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-xs text-white/50 mb-1">Start</div>
                  <div className="text-lg font-semibold text-white/90">{formatPrice(data[0]?.value)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/50 mb-1">Latest</div>
                  <div className="text-lg font-semibold text-white/90">{formatPrice(data[data.length - 1]?.value)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/50 mb-1">Change</div>
                  <div className={`text-lg font-semibold ${
                    (data[data.length - 1]?.value - data[0]?.value) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {data.length > 1 && formatPrice(data[data.length - 1]?.value - data[0]?.value)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-white/50">
              <p>No historical data available</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
