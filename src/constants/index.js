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
      { id: 1, type: 'SMA', name: 'SMA Crossover', period: 20, condition: 'price_above' }
    ],
    longExitIndicators: [
      { id: 1, type: 'SMA', name: 'SMA Crossover', period: 50, condition: 'price_below' }
    ],
    shortEnabled: true,
    shortEntryIndicators: [
      { id: 1, type: 'RSI', name: 'RSI Overbought', period: 14, overbought: 70, oversold: 30, condition: 'above_threshold' }
    ],
    shortExitIndicators: [
      { id: 1, type: 'RSI', name: 'RSI Oversold', period: 14, overbought: 70, oversold: 30, condition: 'below_threshold' }
    ],
    stopLoss: 5,
    takeProfit: 15,
    initialCapital: 10000,
    positionSize: 10
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
        { name: 'period', type: 'number', default: 20, min: 1 }
      ],
      conditions: [
        { id: 'price_above', name: 'Price above SMA' },
        { id: 'price_below', name: 'Price below SMA' },
        { id: 'price_cross_above', name: 'Price crosses above SMA' },
        { id: 'price_cross_below', name: 'Price crosses below SMA' }
      ]
    },
    {
      type: 'EMA',
      name: 'Exponential Moving Average',
      description: 'Weighted average price with more emphasis on recent prices',
      parameters: [
        { name: 'period', type: 'number', default: 20, min: 1 }
      ],
      conditions: [
        { id: 'price_above', name: 'Price above EMA' },
        { id: 'price_below', name: 'Price below EMA' },
        { id: 'price_cross_above', name: 'Price crosses above EMA' },
        { id: 'price_cross_below', name: 'Price crosses below EMA' }
      ]
    },
    {
      type: 'RSI',
      name: 'Relative Strength Index',
      description: 'Momentum oscillator that measures the speed and change of price movements',
      parameters: [
        { name: 'period', type: 'number', default: 14, min: 1 },
        { name: 'overbought', type: 'number', default: 70, min: 0, max: 100 },
        { name: 'oversold', type: 'number', default: 30, min: 0, max: 100 }
      ],
      conditions: [
        { id: 'above_threshold', name: 'Above threshold' },
        { id: 'below_threshold', name: 'Below threshold' },
        { id: 'cross_above', name: 'Crosses above threshold' },
        { id: 'cross_below', name: 'Crosses below threshold' }
      ]
    },
    {
      type: 'MACD',
      name: 'Moving Average Convergence Divergence',
      description: 'Trend-following momentum indicator showing the relationship between two EMAs',
      parameters: [
        { name: 'fastPeriod', type: 'number', default: 12, min: 1 },
        { name: 'slowPeriod', type: 'number', default: 26, min: 1 },
        { name: 'signalPeriod', type: 'number', default: 9, min: 1 }
      ],
      conditions: [
        { id: 'crossover', name: 'Signal line crossover' },
        { id: 'above_zero', name: 'MACD above zero' },
        { id: 'below_zero', name: 'MACD below zero' },
        { id: 'cross_above_zero', name: 'MACD crosses above zero' },
        { id: 'cross_below_zero', name: 'MACD crosses below zero' }
      ]
    },
    {
      type: 'BB',
      name: 'Bollinger Bands',
      description: 'Volatility bands placed above and below a moving average',
      parameters: [
        { name: 'period', type: 'number', default: 20, min: 1 },
        { name: 'stdDev', type: 'number', default: 2, min: 0.1, step: 0.1 }
      ],
      conditions: [
        { id: 'price_above_upper', name: 'Price above upper band' },
        { id: 'price_below_lower', name: 'Price below lower band' },
        { id: 'price_cross_upper', name: 'Price crosses above upper band' },
        { id: 'price_cross_lower', name: 'Price crosses below lower band' }
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
      max: 1000000,
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
   * Chart timeframes
   */
  export const TIMEFRAMES = [
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '1Y', label: '1 Year' },
    { value: 'ALL', label: 'All Time' }
  ];