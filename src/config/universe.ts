export type ProviderType = 'YAHOO' | 'FRED' | 'MSN' | 'BINANCE';

export interface Instrument {
  id: string;
  name: string;
  type: 'COMMODITY' | 'INDEX' | 'CURRENCY' | 'CRYPTO' | 'RATE' | 'MACRO';
  providerPriority: ProviderType[];
  yahooSymbols?: string[];
  msnQuery?: string;
  binanceSymbol?: string;
  fredSeries?: string;
}

export const INSTRUMENTS: Record<string, Instrument> = {
  GOLD_SPOT: {
    id: 'GOLD_SPOT',
    name: 'Gold Spot',
    type: 'COMMODITY',
    providerPriority: ['MSN', 'YAHOO'],
    yahooSymbols: ['XAUUSD=X', 'GC=F'],
  },
  PAXG: {
    id: 'PAXG',
    name: 'PAX Gold',
    type: 'COMMODITY',
    providerPriority: ['BINANCE', 'MSN', 'YAHOO'],
    // PAXG/USD proxy via Binance PAXG/USDT.
    binanceSymbol: 'PAXGUSDT',
    yahooSymbols: ['PAXG-USD'],
  },
  SILVER_SPOT: {
    id: 'SILVER_SPOT',
    name: 'Silver Spot',
    type: 'COMMODITY',
    providerPriority: ['MSN', 'YAHOO'],
    yahooSymbols: ['XAGUSD=X', 'SI=F'],
  },
  WTI: {
    id: 'WTI',
    name: 'WTI Crude Oil',
    type: 'COMMODITY',
    providerPriority: ['MSN', 'YAHOO'],
    yahooSymbols: ['CL=F'],
  },
  COPPER: {
    id: 'COPPER',
    name: 'Copper',
    type: 'COMMODITY',
    providerPriority: ['MSN', 'YAHOO'],
    yahooSymbols: ['HG=F'],
  },
  SPX: {
    id: 'SPX',
    name: 'S&P 500',
    type: 'INDEX',
    providerPriority: ['MSN', 'YAHOO'],
    yahooSymbols: ['^GSPC'],
  },
  DXY: {
    id: 'DXY',
    name: 'Dollar Index',
    type: 'INDEX',
    // MSN autosuggest for "Dollar Index" often returns the UUP ETF first; override query to resolve to the
    // actual ICE U.S. Dollar Index (DXY).
    providerPriority: ['MSN', 'YAHOO'],
    msnQuery: 'ICE U.S. Dollar Index',
    yahooSymbols: ['DX-Y.NYB'],
  },
  EURUSD: {
    id: 'EURUSD',
    name: 'EUR/USD',
    type: 'CURRENCY',
    providerPriority: ['MSN', 'YAHOO'],
    yahooSymbols: ['EURUSD=X'],
  },
  USDJPY: {
    id: 'USDJPY',
    name: 'USD/JPY',
    type: 'CURRENCY',
    providerPriority: ['MSN', 'YAHOO'],
    yahooSymbols: ['USDJPY=X'],
  },
  BTC: {
    id: 'BTC',
    name: 'Bitcoin',
    type: 'CRYPTO',
    providerPriority: ['MSN', 'YAHOO'],
    yahooSymbols: ['BTC-USD'],
  },
  US10Y_NOMINAL: {
    id: 'US10Y_NOMINAL',
    name: 'US 10Y Nominal',
    type: 'RATE',
    providerPriority: ['FRED'],
    fredSeries: 'DGS10',
  },
  US10Y_REAL: {
    id: 'US10Y_REAL',
    name: 'US 10Y Real',
    type: 'RATE',
    providerPriority: ['FRED'],
    fredSeries: 'DFII10',
  },
  US_M2: {
    id: 'US_M2',
    name: 'US M2 Money Supply',
    type: 'MACRO',
    providerPriority: ['FRED'],
    fredSeries: 'M2SL',
  },
  US_DEBT_TOTAL: {
    id: 'US_DEBT_TOTAL',
    name: 'US Total Debt',
    type: 'MACRO',
    providerPriority: ['FRED'],
    fredSeries: 'GFDEBTN',
  },
  US_CPI_U: {
    id: 'US_CPI_U',
    name: 'US CPI (CPI-U)',
    type: 'MACRO',
    providerPriority: ['FRED'],
    fredSeries: 'CPIAUCSL',
  },
  US_PCEPI: {
    id: 'US_PCEPI',
    name: 'US PCE Price Index',
    type: 'MACRO',
    providerPriority: ['FRED'],
    fredSeries: 'PCEPI',
  },
};

export function getInstrument(id: string): Instrument | undefined {
  return INSTRUMENTS[id];
}

export function getAllInstruments(): Instrument[] {
  return Object.values(INSTRUMENTS);
}

export function getInstrumentsRequiringFred(): Instrument[] {
  return Object.values(INSTRUMENTS).filter(i => i.providerPriority.includes('FRED'));
}
