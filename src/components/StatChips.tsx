import { cn } from '@/lib/utils';

interface StatChipProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatChip({ label, value, className }: StatChipProps) {
  return (
    <div className={cn('glass rounded-lg p-4 text-center', className)}>
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className="text-lg font-semibold text-white/90">{value}</div>
    </div>
  );
}

interface StatChipsGridProps {
  stats: {
    latest?: number;
    min?: number;
    max?: number;
    median?: number;
    mean?: number;
    std?: number;
    percentile?: number;
    zScore?: number;
  };
  formatValue?: (value: number) => string;
}

export function StatChips({ stats, formatValue }: StatChipsGridProps) {
  const defaultFormat = (v: number) => (v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : v.toFixed(2));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatChip
        label="Latest"
        value={formatValue ? formatValue(stats.latest || 0) : defaultFormat(stats.latest || 0)}
      />
      <StatChip
        label="Min"
        value={formatValue ? formatValue(stats.min || 0) : defaultFormat(stats.min || 0)}
      />
      <StatChip
        label="Median"
        value={formatValue ? formatValue(stats.median || 0) : defaultFormat(stats.median || 0)}
      />
      <StatChip
        label="Max"
        value={formatValue ? formatValue(stats.max || 0) : defaultFormat(stats.max || 0)}
      />
      <StatChip
        label="Mean"
        value={formatValue ? formatValue(stats.mean || 0) : defaultFormat(stats.mean || 0)}
      />
      <StatChip
        label="Std Dev"
        value={formatValue ? formatValue(stats.std || 0) : defaultFormat(stats.std || 0)}
      />
      <StatChip
        label="Percentile"
        value={`${stats.percentile?.toFixed(1) || 'N/A'}%`}
      />
      <StatChip
        label="Z-Score"
        value={stats.zScore?.toFixed(2) || 'N/A'}
      />
    </div>
  );
}
