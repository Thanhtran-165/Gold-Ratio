export interface Ratio {
  id: string;
  name: string;
  description: string;
  requiresFred: boolean;
  computeSpec: {
    numerator: string;
    denominator: string;
    operation: 'divide' | 'multiply';
    indexedToWindow?: boolean;
    indexedToWindowBase?: number;
  };
}

export const RATIOS: Record<string, Ratio> = {
  XAU_XAG: {
    id: 'XAU_XAG',
    name: 'Gold/Silver Ratio',
    description: 'Gold price divided by Silver price',
    requiresFred: false,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'SILVER_SPOT',
      operation: 'divide',
    },
  },
  XAU_WTI: {
    id: 'XAU_WTI',
    name: 'Gold/Oil Ratio',
    description: 'Gold price divided by WTI Crude Oil',
    requiresFred: false,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'WTI',
      operation: 'divide',
    },
  },
  XAU_COPPER: {
    id: 'XAU_COPPER',
    name: 'Gold/Copper Ratio',
    description: 'Gold price divided by Copper',
    requiresFred: false,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'COPPER',
      operation: 'divide',
    },
  },
  SPX_XAU: {
    id: 'SPX_XAU',
    name: 'S&P 500/Gold Ratio',
    description: 'S&P 500 divided by Gold price',
    requiresFred: false,
    computeSpec: {
      numerator: 'SPX',
      denominator: 'GOLD_SPOT',
      operation: 'divide',
    },
  },
  XAU_DXY: {
    id: 'XAU_DXY',
    name: 'Gold/Dollar Ratio',
    description: 'Gold price divided by Dollar Index',
    requiresFred: false,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'DXY',
      operation: 'divide',
    },
  },
  XAU_EUR: {
    id: 'XAU_EUR',
    name: 'Gold/EUR (proxy)',
    description: 'Gold price divided by EUR/USD (proxy for XAU/EUR)',
    requiresFred: false,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'EURUSD',
      operation: 'divide',
    },
  },
  XAU_JPY: {
    id: 'XAU_JPY',
    name: 'Gold/JPY (proxy)',
    description: 'Gold price multiplied by USD/JPY (proxy for XAU/JPY)',
    requiresFred: false,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'USDJPY',
      operation: 'multiply',
    },
  },
  XAU_BTC: {
    id: 'XAU_BTC',
    name: 'Gold/Bitcoin Ratio',
    description: 'Gold price divided by Bitcoin',
    requiresFred: false,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'BTC',
      operation: 'divide',
    },
  },
  XAU_US10Y_REAL: {
    id: 'XAU_US10Y_REAL',
    name: 'Gold/10Y Real Rate',
    description: 'Gold price divided by US 10-Year Real Yield',
    requiresFred: true,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'US10Y_REAL',
      operation: 'divide',
    },
  },
  XAU_M2: {
    id: 'XAU_M2',
    name: 'Gold/M2 Ratio',
    description: 'Gold price divided by US M2 Money Supply',
    requiresFred: true,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'US_M2',
      operation: 'divide',
    },
  },
  XAU_DEBT: {
    id: 'XAU_DEBT',
    name: 'Gold/US Debt Ratio',
    description: 'Gold price divided by US Total Debt',
    requiresFred: true,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'US_DEBT_TOTAL',
      operation: 'divide',
    },
  },
  XAU_adj_M2: {
    id: 'XAU_adj_M2',
    name: 'Gold/Adjusted M2',
    description: 'Gold divided by (M2 indexed to window start = 100)',
    requiresFred: true,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'US_M2',
      operation: 'divide',
      indexedToWindow: true,
    },
  },
  XAU_adj_DEBT: {
    id: 'XAU_adj_DEBT',
    name: 'Gold/Adjusted Debt',
    description: 'Gold divided by (US Debt indexed to window start = 100)',
    requiresFred: true,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'US_DEBT_TOTAL',
      operation: 'divide',
      indexedToWindow: true,
    },
  },
  XAU_REAL_CPI: {
    id: 'XAU_REAL_CPI',
    name: 'Gold (Real, CPI-U)',
    description: 'Gold price adjusted for inflation using CPI-U (window-start dollars)',
    requiresFred: true,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'US_CPI_U',
      operation: 'divide',
      indexedToWindow: true,
      // CPI factor = CPI(t) / CPI(windowStart); so Gold / factor = Gold * CPI(windowStart) / CPI(t)
      indexedToWindowBase: 1,
    },
  },
  XAU_REAL_PCE: {
    id: 'XAU_REAL_PCE',
    name: 'Gold (Real, PCE)',
    description: 'Gold price adjusted for inflation using PCE (window-start dollars)',
    requiresFred: true,
    computeSpec: {
      numerator: 'GOLD_SPOT',
      denominator: 'US_PCEPI',
      operation: 'divide',
      indexedToWindow: true,
      indexedToWindowBase: 1,
    },
  },
};

export function getRatio(id: string): Ratio | undefined {
  return RATIOS[id];
}

export function getAllRatios(): Ratio[] {
  return Object.values(RATIOS);
}

export function getCoreRatios(): Ratio[] {
  return Object.values(RATIOS).filter(r => !r.requiresFred);
}

export function getFredRatios(): Ratio[] {
  return Object.values(RATIOS).filter(r => r.requiresFred);
}
