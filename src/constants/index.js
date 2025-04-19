// --- Fil: src/constants/index.js ---

/**
 * Application constants
 */

/**
 * Default strategy configuration
 */
export const DEFAULT_STRATEGY = {
    name: 'My Trading Strategy',
    longEnabled: true,
    longEntryIndicators: [
      // Default can be empty or include a simple one
      // { id: 1, type: 'SMA', name: 'SMA Crossover Entry', period: 20, condition: 'price_cross_above' }
    ],
    longExitIndicators: [
      // { id: 1, type: 'SMA', name: 'SMA Crossover Exit', period: 50, condition: 'price_cross_below' }
    ],
    shortEnabled: true,
    shortEntryIndicators: [
      // { id: 1, type: 'RSI', name: 'RSI Overbought Entry', period: 14, overbought: 70, oversold: 30, condition: 'cross_below_threshold' } // Corrected default condition
    ],
    shortExitIndicators: [
      // { id: 1, type: 'RSI', name: 'RSI Oversold Exit', period: 14, overbought: 70, oversold: 30, condition: 'cross_above_threshold' } // Corrected default condition
    ],
    stopLoss: 5, // Percentage
    takeProfit: 15, // Percentage
    initialCapital: 10000, // Currency units
    positionSize: 10 // Percentage of capital
};

/**
 * Available technical indicators
 */
export const AVAILABLE_INDICATORS = [
  {
    type: 'SMA',
    name: 'Simple Moving Average',
    description: 'Average price over a specific number of periods',
    parameters: [
      { name: 'period', label: 'Period', type: 'number', default: 20, min: 1 }
    ],
    conditions: [
      { id: 'price_above', name: 'Price > SMA' },
      { id: 'price_below', name: 'Price < SMA' },
      { id: 'price_cross_above', name: 'Price crosses above SMA' },
      { id: 'price_cross_below', name: 'Price crosses below SMA' }
    ]
  },
  { // --- ADDED EMA ---
    type: 'EMA',
    name: 'Exponential Moving Average',
    description: 'Weighted average price with more emphasis on recent prices',
    parameters: [
      { name: 'period', label: 'Period', type: 'number', default: 20, min: 1 }
    ],
    conditions: [
      { id: 'price_above', name: 'Price > EMA' },
      { id: 'price_below', name: 'Price < EMA' },
      { id: 'price_cross_above', name: 'Price crosses above EMA' },
      { id: 'price_cross_below', name: 'Price crosses below EMA' }
    ]
  },
  {
    type: 'RSI',
    name: 'Relative Strength Index',
    description: 'Momentum oscillator measuring speed and change of price movements',
    parameters: [
      { name: 'period', label: 'Period', type: 'number', default: 14, min: 1 },
      { name: 'overbought', label: 'Overbought', type: 'number', default: 70, min: 0, max: 100 },
      { name: 'oversold', label: 'Oversold', type: 'number', default: 30, min: 0, max: 100 }
    ],
    conditions: [
      { id: 'above_threshold', name: 'RSI > Overbought' },
      { id: 'below_threshold', name: 'RSI < Oversold' },
      { id: 'cross_above_threshold', name: 'RSI crosses above Threshold' }, // Threshold determined by context (OB/OS)
      { id: 'cross_below_threshold', name: 'RSI crosses below Threshold' }  // Threshold determined by context (OB/OS)
    ]
  },
  {
    type: 'MACD',
    name: 'Moving Average Convergence Divergence',
    description: 'Trend-following momentum indicator showing relationship between two EMAs',
    parameters: [
      { name: 'fastPeriod', label: 'Fast Period', type: 'number', default: 12, min: 1 },
      { name: 'slowPeriod', label: 'Slow Period', type: 'number', default: 26, min: 1 },
      { name: 'signalPeriod', label: 'Signal Period', type: 'number', default: 9, min: 1 }
    ],
    conditions: [
      { id: 'cross_above_signal', name: 'MACD crosses above Signal' },
      { id: 'cross_below_signal', name: 'MACD crosses below Signal' },
      { id: 'above_zero', name: 'MACD > 0' },
      { id: 'below_zero', name: 'MACD < 0' },
      { id: 'cross_above_zero', name: 'MACD crosses above 0' },
      { id: 'cross_below_zero', name: 'MACD crosses below 0' }
    ]
  },
  { // --- ADDED BB ---
    type: 'BB',
    name: 'Bollinger Bands',
    description: 'Volatility bands placed above and below a moving average',
    parameters: [
      { name: 'period', label: 'Period', type: 'number', default: 20, min: 1 },
      { name: 'stdDev', label: 'Std Dev', type: 'number', default: 2, min: 0.1, step: 0.1 }
    ],
    conditions: [
      { id: 'price_above_upper', name: 'Price > Upper Band' },
      { id: 'price_below_lower', name: 'Price < Lower Band' },
      { id: 'price_cross_upper', name: 'Price crosses above Upper' },
      { id: 'price_cross_lower', name: 'Price crosses below Lower' }
    ]
  },
  { // --- ADDED STOCH ---
    type: 'Stoch',
    name: 'Stochastic Oscillator',
    description: 'Momentum indicator comparing closing price to price range over a period',
    parameters: [
        { name: 'kPeriod', label: '%K Period', type: 'number', default: 14, min: 1 },
        { name: 'dPeriod', label: '%D Period', type: 'number', default: 3, min: 1 },
        { name: 'smoothing', label: 'Smoothing', type: 'number', default: 3, min: 1 } // K smoothing for Slow Stoch
    ],
    conditions: [
        { id: 'k_cross_above_d', name: '%K crosses above %D' },
        { id: 'k_cross_below_d', name: '%K crosses below %D' },
        { id: 'k_above_d', name: '%K > %D' },
        { id: 'k_below_d', name: '%K < %D' },
        { id: 'k_above_threshold', name: '%K > Overbought (80)' },
        { id: 'k_below_threshold', name: '%K < Oversold (20)' },
        { id: 'k_cross_above_threshold', name: '%K crosses above Threshold' }, // Use 80/20
        { id: 'k_cross_below_threshold', name: '%K crosses below Threshold' } // Use 80/20
    ]
  }
];

/**
 * Risk management options
 */
export const RISK_MANAGEMENT_OPTIONS = {
  stopLoss: {
    min: 0,
    max: 100,
    step: 0.1,
    default: 5
  },
  takeProfit: {
    min: 0,
    max: 100,
    step: 0.1,
    default: 15
  },
  initialCapital: {
    min: 100,
    max: 10000000, // Increased max
    step: 100,
    default: 10000
  },
  positionSize: {
    min: 1,
    max: 100,
    step: 1,
    default: 10
  }
};

/**
 * Trade types
 */
export const TRADE_TYPES = {
  LONG: 'LONG',
  SHORT: 'SHORT'
};

/**
 * Chart timeframes (Consider fetching from API instead)
 * Keep this only as a fallback or remove if API provides them reliably.
 */
export const TIMEFRAMES = [
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' },
  { value: '1M', label: '1 Month' },
  // { value: '3M', label: '3 Months' }, // Example longer frames
  // { value: '1Y', label: '1 Year' },
  // { value: 'ALL', label: 'All Time' } // 'ALL' needs specific handling in fetch
];