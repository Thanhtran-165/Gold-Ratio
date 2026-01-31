export interface Statistics {
  min: number;
  max: number;
  median: number;
  mean: number;
  std: number;
  percentile: number;
  zScore: number;
}

export function calculateStats(values: number[], latestValue: number): Statistics {
  if (values.length === 0) {
    return {
      min: NaN,
      max: NaN,
      median: NaN,
      mean: NaN,
      std: NaN,
      percentile: NaN,
      zScore: NaN,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);

  const percentile = (sorted.filter(v => v <= latestValue).length / sorted.length) * 100;

  const zScore = std > 0 ? (latestValue - mean) / std : 0;

  return {
    min,
    max,
    median,
    mean,
    std,
    percentile,
    zScore,
  };
}
