/**
 * Technical indicators calculation utilities
 */

/**
 * Calculate Simple Moving Average (SMA)
 * 
 * @param {Array} data - Price data array
 * @param {number} period - Period for SMA calculation
 * @returns {Array} Array of SMA values
 */
export const calculateSMA = (data, period) => {
    const result = [];
    
    // Need at least 'period' data points to calculate SMA
    if (data.length < period) {
      console.warn('Not enough data points to calculate SMA');
      return Array(data.length).fill(null);
    }
    
    // First period-1 elements will be null (not enough data)
    for (let i = 0; i < period - 1; i++) {
      result.push(null);
    }
    
    // Calculate SMA for the rest of the data
    for (let i = period - 1; i < data.length; i++) {
      const windowSlice = data.slice(i - period + 1, i + 1);
      const sum = windowSlice.reduce((acc, val) => acc + val, 0);
      result.push(sum / period);
    }
    
    return result;
  };
  
  /**
   * Calculate Exponential Moving Average (EMA)
   * 
   * @param {Array} data - Price data array
   * @param {number} period - Period for EMA calculation
   * @returns {Array} Array of EMA values
   */
  export const calculateEMA = (data, period) => {
    const result = [];
    
    // Need at least 'period' data points to calculate EMA
    if (data.length < period) {
      console.warn('Not enough data points to calculate EMA');
      return Array(data.length).fill(null);
    }
    
    // First period-1 elements will be null
    for (let i = 0; i < period - 1; i++) {
      result.push(null);
    }
    
    // Calculate multiplier
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    const initialSMA = data.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
    result.push(initialSMA);
    
    // Calculate EMA for the rest of the data
    for (let i = period; i < data.length; i++) {
      const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
      result.push(ema);
    }
    
    return result;
  };
  
  /**
   * Calculate Relative Strength Index (RSI)
   * 
   * @param {Array} data - Price data array
   * @param {number} period - Period for RSI calculation (typically 14)
   * @returns {Array} Array of RSI values
   */
  export const calculateRSI = (data, period = 14) => {
    const result = [];
    const gains = [];
    const losses = [];
    
    // Need at least period+1 data points to calculate RSI
    if (data.length <= period) {
      console.warn('Not enough data points to calculate RSI');
      return Array(data.length).fill(null);
    }
    
    // Calculate initial price changes, gains, and losses
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // First period elements will be null
    for (let i = 0; i < period; i++) {
      result.push(null);
    }
    
    // Calculate first average gain and loss
    let avgGain = gains.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
    
    // Calculate RSI using Wilder's smoothing method
    for (let i = period; i < data.length - 1; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i - 1]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i - 1]) / period;
      
      const rs = avgLoss > 0 ? avgGain / avgLoss : avgGain > 0 ? 100 : 0;
      const rsi = 100 - (100 / (1 + rs));
      
      result.push(rsi);
    }
    
    return result;
  };
  
  /**
   * Calculate Moving Average Convergence Divergence (MACD)
   * 
   * @param {Array} data - Price data array
   * @param {number} fastPeriod - Fast EMA period (typically 12)
   * @param {number} slowPeriod - Slow EMA period (typically 26)
   * @param {number} signalPeriod - Signal EMA period (typically 9)
   * @returns {Object} Object containing MACD, signal, and histogram arrays
   */
  export const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    // Calculate fast and slow EMAs
    const fastEMA = calculateEMA(data, fastPeriod);
    const slowEMA = calculateEMA(data, slowPeriod);
    
    // Calculate MACD line
    const macdLine = [];
    for (let i = 0; i < data.length; i++) {
      if (fastEMA[i] === null || slowEMA[i] === null) {
        macdLine.push(null);
      } else {
        macdLine.push(fastEMA[i] - slowEMA[i]);
      }
    }
    
    // Calculate signal line (EMA of MACD line)
    // First, filter out null values
    const validMacdValues = macdLine.filter(val => val !== null);
    const signalLine = Array(data.length - validMacdValues.length).fill(null);
    
    if (validMacdValues.length >= signalPeriod) {
      const signalEMA = calculateEMA(validMacdValues, signalPeriod);
      signalLine.push(...signalEMA);
    }
    
    // Calculate histogram (MACD - Signal)
    const histogram = [];
    for (let i = 0; i < data.length; i++) {
      if (macdLine[i] === null || signalLine[i] === null) {
        histogram.push(null);
      } else {
        histogram.push(macdLine[i] - signalLine[i]);
      }
    }
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram
    };
  };
  
  /**
   * Calculate Bollinger Bands
   * 
   * @param {Array} data - Price data array
   * @param {number} period - Period for calculation (typically 20)
   * @param {number} stdDev - Number of standard deviations (typically 2)
   * @returns {Object} Object containing middle, upper, and lower band arrays
   */
  export const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
    // Calculate SMA for middle band
    const middle = calculateSMA(data, period);
    
    // Calculate standard deviation
    const upper = [];
    const lower = [];
    
    for (let i = 0; i < data.length; i++) {
      if (middle[i] === null) {
        upper.push(null);
        lower.push(null);
        continue;
      }
      
      // Calculate standard deviation for the window
      const windowSlice = data.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const squaredDiffs = windowSlice.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;
      const sd = Math.sqrt(variance);
      
      // Calculate upper and lower bands
      upper.push(mean + (sd * stdDev));
      lower.push(mean - (sd * stdDev));
    }
    
    return {
      middle,
      upper,
      lower
    };
  };