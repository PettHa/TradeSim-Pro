// --- Fil: src/utils/indicators.js ---

/**
 * Technical indicators calculation utilities
 */

/**
 * Calculate Simple Moving Average (SMA)
 *
 * @param {Array<number>} data - Price data array (e.g., closes).
 * @param {number} period - Period for SMA calculation.
 * @returns {Array<number|null>} Array of SMA values or nulls.
 */
export const calculateSMA = (data, period) => {
    if (!data || data.length === 0 || period <= 0) {
        console.warn('calculateSMA: Invalid input data or period.');
        return Array(data?.length || 0).fill(null);
    }
    if (data.length < period) {
        // console.warn(`calculateSMA: Not enough data points (${data.length}) for period ${period}.`);
        return Array(data.length).fill(null);
    }

    const result = Array(period - 1).fill(null); // Pad beginning with nulls
    let sum = data.slice(0, period).reduce((acc, val) => acc + (val ?? 0), 0); // Initial sum, handle nulls

    result.push(sum / period); // First SMA value

    for (let i = period; i < data.length; i++) {
        // Optimized sum calculation: subtract oldest, add newest
        const oldestValue = data[i - period] ?? 0;
        const newestValue = data[i] ?? 0;
        sum = sum - oldestValue + newestValue;
        result.push(sum / period);
    }

    return result;
};

/**
 * Calculate Exponential Moving Average (EMA)
 *
 * @param {Array<number>} data - Price data array.
 * @param {number} period - Period for EMA calculation.
 * @returns {Array<number|null>} Array of EMA values or nulls.
 */
export const calculateEMA = (data, period) => {
     if (!data || data.length === 0 || period <= 0) {
        console.warn('calculateEMA: Invalid input data or period.');
        return Array(data?.length || 0).fill(null);
    }
    if (data.length < period) {
        // console.warn(`calculateEMA: Not enough data points (${data.length}) for period ${period}.`);
        return Array(data.length).fill(null);
    }

    const result = Array(period - 1).fill(null); // Pad beginning
    const multiplier = 2 / (period + 1);

    // Calculate initial SMA as the first EMA value
    const initialSlice = data.slice(0, period).filter(v => v !== null); // Filter nulls for initial SMA
     if (initialSlice.length < period) {
          console.warn(`calculateEMA: Not enough non-null values in initial slice for period ${period}.`);
          return Array(data.length).fill(null); // Cannot calculate initial SMA reliably
     }
    let previousEma = initialSlice.reduce((acc, val) => acc + val, 0) / period;
    result.push(previousEma);

    // Calculate subsequent EMA values
    for (let i = period; i < data.length; i++) {
        const currentValue = data[i];
        if (currentValue === null) {
            result.push(null); // Propagate nulls
            // If previous EMA was null, we cannot calculate further accurately.
            // We could reset, but propagating null is safer.
            previousEma = null;
        } else if (previousEma === null) {
             result.push(null); // Cannot calculate if previous EMA is null
        }
        else {
            const ema = (currentValue - previousEma) * multiplier + previousEma;
            result.push(ema);
            previousEma = ema;
        }
    }

    return result;
};

/**
 * Calculate Relative Strength Index (RSI)
 *
 * @param {Array<number>} data - Price data array (closes).
 * @param {number} period - Period for RSI calculation (typically 14).
 * @returns {Array<number|null>} Array of RSI values or nulls.
 */
export const calculateRSI = (data, period = 14) => {
    if (!data || data.length <= period || period <= 0) {
         console.warn(`calculateRSI: Not enough data points (${data?.length}) for period ${period}.`);
        return Array(data?.length || 0).fill(null);
    }

    const result = Array(period).fill(null); // Pad beginning
    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = (data[i] ?? 0) - (data[i - 1] ?? 0); // Handle potential nulls
        if (change > 0) {
            gains += change;
        } else {
            losses += Math.abs(change);
        }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate first RSI
    const firstRs = avgLoss > 0 ? avgGain / avgLoss : (avgGain > 0 ? Infinity : 1); // Handle zero loss, default RS to 1 if no change
    const firstRsi = 100 - (100 / (1 + firstRs));
    result.push(firstRsi);


    // Calculate subsequent RSIs using Wilder's smoothing
    for (let i = period + 1; i < data.length; i++) {
        const change = (data[i] ?? 0) - (data[i - 1] ?? 0);
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;

        const rs = avgLoss > 0 ? avgGain / avgLoss : (avgGain > 0 ? Infinity : 1);
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
    }

    return result;
};


/**
 * Calculate Moving Average Convergence Divergence (MACD)
 *
 * @param {Array<number>} data - Price data array (closes).
 * @param {number} fastPeriod - Fast EMA period (typically 12).
 * @param {number} slowPeriod - Slow EMA period (typically 26).
 * @param {number} signalPeriod - Signal EMA period (typically 9).
 * @returns {Object} Object containing { macd: Array<number|null>, signal: Array<number|null>, histogram: Array<number|null> }
 */
export const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
     const nullResult = {
         macd: Array(data?.length || 0).fill(null),
         signal: Array(data?.length || 0).fill(null),
         histogram: Array(data?.length || 0).fill(null),
     };
     if (!data || data.length < slowPeriod || fastPeriod <= 0 || slowPeriod <= 0 || signalPeriod <= 0 || fastPeriod >= slowPeriod) {
        console.warn('calculateMACD: Invalid input data or periods.');
        return nullResult;
    }

    const fastEMA = calculateEMA(data, fastPeriod);
    const slowEMA = calculateEMA(data, slowPeriod);

    const macdLine = Array(data.length).fill(null);
    for (let i = slowPeriod - 1; i < data.length; i++) { // Start calculation where both EMAs are valid
        if (fastEMA[i] !== null && slowEMA[i] !== null) {
            macdLine[i] = fastEMA[i] - slowEMA[i];
        }
    }

    // Calculate signal line (EMA of MACD line)
    const validMacdValues = macdLine.slice(slowPeriod - 1); // Get only the valid MACD values
    const signalLineTmp = calculateEMA(validMacdValues, signalPeriod);

    const signalLine = Array(data.length).fill(null);
     // Align signal line with the original data array
     if (signalLineTmp.length > 0) {
         for (let i = 0; i < signalLineTmp.length; i++) {
             const originalIndex = i + (slowPeriod - 1) + (signalPeriod -1) ; // Start index in original data
             if (originalIndex < data.length) {
                signalLine[originalIndex] = signalLineTmp[i];
             }
         }
     }

    // Calculate histogram
    const histogram = Array(data.length).fill(null);
    for (let i = 0; i < data.length; i++) {
        if (macdLine[i] !== null && signalLine[i] !== null) {
            histogram[i] = macdLine[i] - signalLine[i];
        }
    }

    return {
        macd: macdLine,
        signal: signalLine,
        histogram: histogram
    };
};

/**
 * Calculate Bollinger Bands
 *
 * @param {Array<number>} data - Price data array (closes).
 * @param {number} period - Period for calculation (typically 20).
 * @param {number} stdDev - Number of standard deviations (typically 2).
 * @returns {Object} Object containing { middle: Array<number|null>, upper: Array<number|null>, lower: Array<number|null> }
 */
export const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
    const nullResult = {
        middle: Array(data?.length || 0).fill(null),
        upper: Array(data?.length || 0).fill(null),
        lower: Array(data?.length || 0).fill(null),
    };
    if (!data || data.length < period || period <= 0 || stdDev <= 0) {
         console.warn('calculateBollingerBands: Invalid input data or parameters.');
         return nullResult;
    }

    const middleBand = calculateSMA(data, period);
    const upperBand = Array(data.length).fill(null);
    const lowerBand = Array(data.length).fill(null);

    for (let i = period - 1; i < data.length; i++) {
        if (middleBand[i] === null) continue; // Skip if SMA is null

        const slice = data.slice(i - period + 1, i + 1);
        const mean = middleBand[i];

        // Calculate standard deviation for the slice
        const variance = slice.reduce((acc, val) => acc + Math.pow((val ?? mean) - mean, 2), 0) / period; // Handle potential nulls in slice
        const sd = Math.sqrt(variance);

        upperBand[i] = mean + (sd * stdDev);
        lowerBand[i] = mean - (sd * stdDev);
    }

    return {
        middle: middleBand,
        upper: upperBand,
        lower: lowerBand
    };
};


/**
 * Calculate Slow Stochastic Oscillator (%K and %D)
 * Requires high, low, and close prices.
 *
 * @param {Array<number>} highs - Array of high prices.
 * @param {Array<number>} lows - Array of low prices.
 * @param {Array<number>} closes - Array of close prices.
 * @param {number} kPeriod - Lookback period for %K calculation (typically 14).
 * @param {number} dPeriod - Smoothing period for %D (SMA of %K, typically 3).
 * @param {number} smoothing - Smoothing period for %K (SMA of raw %K, typically 3 for Slow Stoch).
 * @returns {Object} Object containing { k: Array<number|null>, d: Array<number|null> }
 */
export const calculateStochastic = (highs, lows, closes, kPeriod = 14, dPeriod = 3, smoothing = 3) => {
    const length = closes?.length || 0;
    const nullResult = { k: Array(length).fill(null), d: Array(length).fill(null) };

    if (!highs || !lows || !closes || highs.length !== length || lows.length !== length || length === 0 || kPeriod <= 0 || dPeriod <= 0 || smoothing <= 0) {
        console.warn('calculateStochastic: Invalid input data or parameters.');
        return nullResult;
    }
     if (length < kPeriod) {
        console.warn(`calculateStochastic: Not enough data points (${length}) for kPeriod ${kPeriod}.`);
        return nullResult;
    }

    const rawK = [];
    const kValues = []; // Smoothed %K
    const dValues = []; // SMA of Smoothed %K

    // Calculate Raw %K
    for (let i = 0; i < length; i++) {
        if (i < kPeriod - 1) {
            rawK.push(null);
            continue;
        }

        const lookbackHighs = highs.slice(i - kPeriod + 1, i + 1).filter(v => v !== null);
        const lookbackLows = lows.slice(i - kPeriod + 1, i + 1).filter(v => v !== null);
        const currentClose = closes[i];

        if (lookbackHighs.length < kPeriod || lookbackLows.length < kPeriod || currentClose === null) {
             rawK.push(null); // Cannot calculate if data is missing in window
             continue;
        }

        const highestHigh = Math.max(...lookbackHighs);
        const lowestLow = Math.min(...lookbackLows);


        if (highestHigh === lowestLow) {
            // Handle flat market: carry forward previous K or default to 50 if first calculation
            const prevRawK = rawK[i-1];
            rawK.push(prevRawK !== null ? prevRawK : 50);
        } else {
            const percentK = 100 * ((currentClose - lowestLow) / (highestHigh - lowestLow));
            rawK.push(percentK);
        }
    }

    // Calculate Smoothed %K (SMA of Raw %K) -> This is the %K for Slow Stochastic
    const validRawK = rawK.filter(k => k !== null);
    let smoothedK = [];
    if (smoothing > 1) {
         if (validRawK.length >= smoothing) {
              smoothedK = calculateSMA(validRawK, smoothing);
         }
    } else {
         smoothedK = validRawK; // No smoothing if period is 1
    }
    // Align smoothedK with original data length
    const smoothedKStartIdx = rawK.findIndex(k => k !== null); // Find index of first non-null raw K
    kValues.push(...Array(smoothedKStartIdx).fill(null)); // Pad beginning
    kValues.push(...smoothedK);
    kValues.push(...Array(length - kValues.length).fill(null)); // Pad end if necessary


    // Calculate %D (SMA of Smoothed %K)
    const validKValues = kValues.filter(k => k !== null);
    let dLine = [];
    if (dPeriod > 0 && validKValues.length >= dPeriod) {
          dLine = calculateSMA(validKValues, dPeriod);
    }
     // Align dLine with original data length
    const dLineStartIdx = kValues.findIndex(k => k !== null); // Find index of first non-null smoothed K
    const dLinePadding = (dLineStartIdx !== -1 ? dLineStartIdx : 0) + (dPeriod -1); // Add dPeriod offset
    dValues.push(...Array(dLinePadding).fill(null));
    dValues.push(...dLine);
    dValues.push(...Array(length - dValues.length).fill(null)); // Pad end


    return { k: kValues, d: dValues };
};