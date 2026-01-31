export interface DataPoint {
  date: string;
  value: number;
}

export function toDailyFFill(data: DataPoint[]): DataPoint[] {
  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const result: DataPoint[] = [];

  let currentIndex = 0;
  let currentDate = new Date(sorted[0].date);
  const endDate = new Date(sorted[sorted.length - 1].date);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];

    while (currentIndex < sorted.length - 1 && new Date(sorted[currentIndex + 1].date) <= currentDate) {
      currentIndex++;
    }

    result.push({
      date: dateStr,
      value: sorted[currentIndex].value,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

export function intersect(series1: DataPoint[], series2: DataPoint[]): DataPoint[][] {
  const map1 = new Map(series1.map(d => [d.date, d.value]));
  const map2 = new Map(series2.map(d => [d.date, d.value]));

  const commonDates = new Set([
    ...series1.map(d => d.date),
    ...series2.map(d => d.date),
  ].filter(date => map1.has(date) && map2.has(date)));

  const intersected1: DataPoint[] = [];
  const intersected2: DataPoint[] = [];

  Array.from(commonDates)
    .sort()
    .forEach(date => {
      intersected1.push({ date, value: map1.get(date)! });
      intersected2.push({ date, value: map2.get(date)! });
    });

  return [intersected1, intersected2];
}

export function computeRatio(
  series1: DataPoint[],
  series2: DataPoint[],
  operation: 'divide' | 'multiply'
): DataPoint[] {
  const map1 = new Map(series1.map(d => [d.date, d.value]));
  const map2 = new Map(series2.map(d => [d.date, d.value]));

  const commonDates = new Set([
    ...series1.map(d => d.date),
    ...series2.map(d => d.date),
  ].filter(date => map1.has(date) && map2.has(date)));

  const result: DataPoint[] = [];

  Array.from(commonDates)
    .sort()
    .forEach(date => {
      const val1 = map1.get(date)!;
      const val2 = map2.get(date)!;

      if (!Number.isFinite(val1) || !Number.isFinite(val2)) {
        return;
      }

      if (operation === 'divide' && val2 === 0) return;

      const ratio = operation === 'divide' ? val1 / val2 : val1 * val2;
      if (!Number.isFinite(ratio)) return;

      result.push({ date, value: ratio });
    });

  return result;
}

export function indexToWindowStart(series: DataPoint[], base: number = 100): DataPoint[] {
  if (series.length === 0) return [];
  if (!Number.isFinite(base) || base === 0) return [];

  const startIndex = series.findIndex(d => !isNaN(d.value) && d.value !== null && d.value !== 0);
  if (startIndex === -1) return [];

  const baseValue = series[startIndex].value;
  if (baseValue === 0) return [];

  return series.map(d => ({
    date: d.date,
    value: (d.value / baseValue) * base,
  }));
}
