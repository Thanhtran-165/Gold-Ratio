// Mock data provider for demo purposes
// Simulates realistic price data for instruments

interface MockQuote {
  symbol: string;
  regularMarketPrice: number;
  previousClose: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

const MOCK_QUOTES: Record<string, MockQuote> = {
  GOLD_SPOT: {
    symbol: 'GOLD_SPOT',
    regularMarketPrice: 2785.50,
    previousClose: 2770.25,
    regularMarketChange: 15.25,
    regularMarketChangePercent: 0.55,
  },
  PAXG: {
    symbol: 'PAXG',
    regularMarketPrice: 2782.30,
    previousClose: 2769.80,
    regularMarketChange: 12.50,
    regularMarketChangePercent: 0.45,
  },
  SILVER_SPOT: {
    symbol: 'SILVER_SPOT',
    regularMarketPrice: 31.42,
    previousClose: 31.15,
    regularMarketChange: 0.27,
    regularMarketChangePercent: 0.87,
  },
  WTI: {
    symbol: 'WTI',
    regularMarketPrice: 76.85,
    previousClose: 75.90,
    regularMarketChange: 0.95,
    regularMarketChangePercent: 1.25,
  },
  COPPER: {
    symbol: 'COPPER',
    regularMarketPrice: 4.28,
    previousClose: 4.22,
    regularMarketChange: 0.06,
    regularMarketChangePercent: 1.42,
  },
  SPX: {
    symbol: 'SPX',
    regularMarketPrice: 5123.45,
    previousClose: 5098.20,
    regularMarketChange: 25.25,
    regularMarketChangePercent: 0.49,
  },
  DXY: {
    symbol: 'DXY',
    regularMarketPrice: 108.25,
    previousClose: 108.10,
    regularMarketChange: 0.15,
    regularMarketChangePercent: 0.14,
  },
  EURUSD: {
    symbol: 'EURUSD',
    regularMarketPrice: 1.0842,
    previousClose: 1.0850,
    regularMarketChange: -0.0008,
    regularMarketChangePercent: -0.07,
  },
  USDJPY: {
    symbol: 'USDJPY',
    regularMarketPrice: 149.85,
    previousClose: 149.60,
    regularMarketChange: 0.25,
    regularMarketChangePercent: 0.17,
  },
  BTC: {
    symbol: 'BTC',
    regularMarketPrice: 98420.50,
    previousClose: 96850.00,
    regularMarketChange: 1570.50,
    regularMarketChangePercent: 1.62,
  },
};

export function getMockQuote(instrumentId: string): MockQuote | null {
  return MOCK_QUOTES[instrumentId] || null;
}

export function getAllMockQuotes(): Record<string, MockQuote | null> {
  return MOCK_QUOTES;
}

// Generate mock historical data
export function generateMockHistoricalData(
  instrumentId: string,
  startDate: Date,
  endDate: Date
): Array<{ date: string; value: number }> {
  const basePrice = MOCK_QUOTES[instrumentId]?.regularMarketPrice || 100;
  const volatility = 0.02; // 2% daily volatility
  const data: Array<{ date: string; value: number }> = [];

  const currentDate = new Date(startDate);
  let price = basePrice * (1 - volatility * 30); // Start from lower price

  while (currentDate <= endDate) {
    // Random walk with mean reversion
    const change = (Math.random() - 0.48) * volatility * price; // Slight upward bias
    price = Math.max(price + change, basePrice * 0.7); // Don't go too low

    data.push({
      date: currentDate.toISOString().split('T')[0],
      value: Number(price.toFixed(2)),
    });

    currentDate.setDate(currentDate.getDate() + 1);

    // Skip weekends
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (dayOfWeek === 6) {
      currentDate.setDate(currentDate.getDate() + 2);
    }
  }

  return data;
}

// Generate mock ratio data
export function generateMockRatioData(
  numeratorId: string,
  denominatorId: string,
  startDate: Date,
  endDate: Date
): Array<{ date: string; value: number }> {
  const numeratorData = generateMockHistoricalData(numeratorId, startDate, endDate);
  const denominatorData = generateMockHistoricalData(denominatorId, startDate, endDate);

  // Align by date and compute ratio
  const ratioMap = new Map<string, number>();

  for (const numPoint of numeratorData) {
    const denPoint = denominatorData.find(d => d.date === numPoint.date);
    if (denPoint && denPoint.value !== 0) {
      ratioMap.set(numPoint.date, numPoint.value / denPoint.value);
    }
  }

  return Array.from(ratioMap.entries()).map(([date, value]) => ({ date, value }));
}

export function calculateMockStats(
  data: Array<{ date: string; value: number }>
): {
  min: number;
  max: number;
  median: number;
  mean: number;
  std: number;
  percentile: number;
  zScore: number;
} {
  const values = data.map(d => d.value);
  const latest = values[values.length - 1];

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  const percentile = (sorted.filter(v => v <= latest).length / sorted.length) * 100;
  const zScore = std > 0 ? (latest - mean) / std : 0;

  return { min, max, median, mean, std, percentile, zScore };
}
