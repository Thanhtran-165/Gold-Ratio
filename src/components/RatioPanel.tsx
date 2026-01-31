'use client';

import { useState, useEffect } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from './GlassCard';
import { ChartSkeleton } from './Skeletons';
import { RangeGauge } from './RangeGauge';
import { StatChips } from './StatChips';
import { Ratio } from '@/config/ratios';
import { formatRatioValue, getPercentileLabel } from '@/lib/format/format';
import { clientCache } from '@/lib/cache';

interface RatioPanelProps {
  ratio: Ratio;
  window: '6M' | '1Y' | '3Y' | '5Y' | '10Y' | 'ALL';
  fredKey: string | null;
  onOpenSettings: () => void;
}

export function RatioPanel({ ratio, window, fredKey, onOpenSettings }: RatioPanelProps) {
  const [data, setData] = useState<any[] | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    fetchData();
  }, [ratio.id, window, fredKey]);

  const fetchData = async () => {
    setLoading(true);
    setLocked(false);

    try {
      const cacheKey = clientCache.generateKey(['ratio', ratio.id, window]);
      const cached = clientCache.get<any>(cacheKey);

      if (cached) {
        setData(cached.data);
        setStats(cached.stats);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/ratio?id=${ratio.id}&window=${window}`,
        {
          headers: fredKey ? { 'x-fred-api-key': fredKey } : {},
        }
      );

      const result = await response.json();

      if (result.locked) {
        setLocked(true);
        setData(null);
        setStats(null);
      } else if (result.error) {
        setData([]);
        setStats(null);
      } else {
        const chartData = result.data.map((d: any) => ({
          date: new Date(d.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: '2-digit',
          }),
          value: d.value,
        }));

        setData(chartData);
        setStats(result.stats);

        // Cache for 1 hour
        clientCache.set(cacheKey, { data: chartData, stats: result.stats }, 60 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to fetch ratio data:', error);
      setData([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (locked) {
    return (
      <div className="glass rounded-xl p-8 border border-amber-500/20">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white/90 mb-2">FRED API Key Required</h3>
            <p className="text-white/60 mb-4">
              This ratio requires FRED data. Please add your API key in settings.
            </p>
            <button
              onClick={onOpenSettings}
              className="px-6 py-3 bg-amber-600/80 hover:bg-amber-600 rounded-lg font-medium transition-colors"
            >
              Open Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <ChartSkeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-xl p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white/90 mb-2">No Data Available</h3>
            <p className="text-white/60">
              Unable to compute this ratio. Please try again later or select a different time window.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const percentileLabel = stats ? getPercentileLabel(stats.percentile) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white/90 mb-1">{ratio.name}</h2>
            <p className="text-sm text-white/50">{ratio.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white/90">
              {stats && formatRatioValue(stats.latest)}
            </div>
            {percentileLabel && (
              <div className={`text-sm font-medium ${percentileLabel.color}`}>
                {percentileLabel.label}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <GlassCard>
        <ResponsiveContainer width="100%" height={350}>
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
              tickFormatter={(value) => formatRatioValue(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              formatter={(value: any) => [formatRatioValue(value), 'Ratio']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#ratioGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <defs>
              <linearGradient id="ratioGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Gauge */}
      {stats && (
        <GlassCard>
          <RangeGauge percentile={stats.percentile} />
        </GlassCard>
      )}

      {/* Statistics */}
      {stats && (
        <div>
          <h3 className="text-lg font-medium text-white/80 mb-4">Statistics</h3>
          <StatChips stats={stats} formatValue={formatRatioValue} />
        </div>
      )}
    </div>
  );
}
