export function formatPrice(value: number, decimals: number = 2): string {
  if (isNaN(value) || !isFinite(value)) return 'N/A';
  return value.toFixed(decimals);
}

export function formatRatioValue(value: number, decimals: number = 4): string {
  if (isNaN(value) || !isFinite(value)) return 'N/A';
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (Math.abs(value) >= 100) {
    return value.toFixed(2);
  }
  if (Math.abs(value) >= 1) {
    return value.toFixed(3);
  }
  return value.toFixed(decimals);
}

export function getPercentileLabel(percentile: number): { label: string; color: string } {
  if (percentile < 20) {
    return { label: 'LOW vs history', color: 'text-emerald-400' };
  }
  if (percentile < 80) {
    return { label: 'MID vs history', color: 'text-yellow-400' };
  }
  return { label: 'HIGH vs history', color: 'text-rose-400' };
}

export function formatChangePercent(current: number, previous: number): string {
  if (!previous || previous === 0) return 'N/A';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return sign + change.toFixed(2) + '%';
}
