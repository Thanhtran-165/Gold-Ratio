import { cn } from '@/lib/utils';

interface RangeGaugeProps {
  percentile: number;
  className?: string;
}

export function RangeGauge({ percentile, className }: RangeGaugeProps) {
  const getColor = (p: number) => {
    if (p < 20) return 'bg-emerald-500';
    if (p < 80) return 'bg-yellow-500';
    return 'bg-rose-500';
  };

  const getTextColor = (p: number) => {
    if (p < 20) return 'text-emerald-400';
    if (p < 80) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const clampedPercentile = Math.max(0, Math.min(100, percentile));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="h-2 bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500 rounded-full relative">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-white/50 transition-all duration-300"
          style={{ left: `calc(${clampedPercentile}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/50">
        <span>Low</span>
        <span className={getTextColor(clampedPercentile) + ' font-semibold'}>
          {clampedPercentile.toFixed(1)}th percentile
        </span>
        <span>High</span>
      </div>
    </div>
  );
}
