// --- Fil: src/services/backtester.js ---

/**
 * Trading strategy backtester service
 *
 * This service simulates trading based on a strategy configuration and market data
 */

// Import Stochastic calculation
import { calculateSMA, calculateRSI, calculateMACD, calculateEMA, calculateBollingerBands, calculateStochastic } from '../utils/indicators';

// --- Helper Functions ---

/**
 * Calculate only the indicators needed by the strategy that are NOT already present in marketData.
 * @param {Object} strategy - The strategy configuration.
 * @param {Array} marketData - Historical market data (must contain date, open, high, low, close).
 * @returns {Object} An object where keys are indicator identifiers (e.g., 'macd_1', 'sma_50') and values are the calculated indicator arrays or objects.
 */
function calculateNeededIndicators(strategy, marketData) {
    const neededIndicators = {};
    const calculatedCache = {}; // Cache results for indicators with same params

    // Check for essential OHLC data, especially for Stochastic
    const hasOHLC = marketData?.[0]?.open !== undefined &&
                    marketData?.[0]?.high !== undefined &&
                    marketData?.[0]?.low !== undefined &&
                    marketData?.[0]?.close !== undefined;

    if (!marketData || marketData.length === 0 || !hasOHLC) {
        console.warn("Backtester: Market data is empty or missing required OHLC columns. Cannot calculate all indicators.");
        return {}; // Cannot proceed reliably
    }

    const closes = marketData.map(d => d.close);
    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);

    // Collect all unique indicator configurations from the strategy
    const allIndicatorConfigs = [
        ...(strategy.longEntryIndicators || []),
        ...(strategy.longExitIndicators || []),
        ...(strategy.shortEntryIndicators || []),
        ...(strategy.shortExitIndicators || [])
    ];
    // Deduplicate based on type and parameters to avoid redundant calculations
    const uniqueIndicatorRequests = allIndicatorConfigs.reduce((acc, indicator) => {
        const key = `${indicator.type}_${JSON.stringify(indicator, Object.keys(indicator).sort().filter(k => k !== 'id' && k !== 'name' && k !== 'condition'))}`; // Key based on type and params
        if (!acc[key]) {
            acc[key] = indicator; // Store the first instance of this config
        }
        return acc;
    }, {});

    // Now calculate only the unique requests
    Object.values(uniqueIndicatorRequests).forEach(indicator => {
        const { id, type } = indicator; // We use the ID from the *first* instance found
        let indicatorKeyInData;
        let cacheKey;
        const outputKey = `${type.toLowerCase()}_${id}`; // Use ID for the output key in neededIndicators

        // Check if common indicators are pre-calculated in marketData
        if (type === 'SMA' && indicator.period === 20) indicatorKeyInData = 'sma20';
        if (type === 'RSI' && indicator.period === 14) indicatorKeyInData = 'rsi';
        // Add other potential pre-calculated checks here (e.g., BB, MACD if backend provides them)

        // Skip if already calculated in this *run* (neededIndicators already has it)
        // Note: This check might be less useful now we deduplicate first, but keep for safety.
        if (neededIndicators[outputKey]) return;

        // Check if present in source marketData (and has valid data)
        if (indicatorKeyInData && marketData.some(d => d?.[indicatorKeyInData] !== null && d?.[indicatorKeyInData] !== undefined)) {
             console.log(`Backtester: Using pre-calculated '${indicatorKeyInData}' for indicator type ${type} (associated with config ID ${id}).`);
             // Instead of skipping, let's copy the data from marketData to neededIndicators under the outputKey
             // This standardizes how checkConditions accesses data.
             neededIndicators[outputKey] = marketData.map(d => d[indicatorKeyInData]);
             // Handle potential object types if backend provides them (e.g., MACD)
             // if (type === 'MACD' && marketData.some(d => d?.macd !== undefined)) { ... }
             return; // Data is now in neededIndicators
        }

        // --- Calculate if not pre-calculated or present ---
        console.log(`Backtester: Calculating indicator ${outputKey} (${type}) with params:`, JSON.stringify(indicator));

        try {
            let result = null;
             // Generate cache key based on type and relevant parameters
             const paramsString = JSON.stringify(indicator, Object.keys(indicator).sort().filter(k => k !== 'id' && k !== 'name' && k !== 'condition'));
             cacheKey = `${type}_${paramsString}`;

            // Check cache first
            if (calculatedCache[cacheKey]) {
                 result = calculatedCache[cacheKey];
                 console.log(`Backtester: Using cached result for ${outputKey}`);
            } else {
                // Calculate based on type
                switch (type) {
                    case 'SMA': result = calculateSMA(closes, indicator.period); break;
                    case 'EMA': result = calculateEMA(closes, indicator.period); break;
                    case 'RSI': result = calculateRSI(closes, indicator.period); break;
                    case 'MACD': result = calculateMACD(closes, indicator.fastPeriod, indicator.slowPeriod, indicator.signalPeriod); break;
                    case 'BB': result = calculateBollingerBands(closes, indicator.period, indicator.stdDev); break;
                    case 'Stoch': result = calculateStochastic(highs, lows, closes, indicator.kPeriod, indicator.dPeriod, indicator.smoothing); break;
                    default: console.warn(`Backtester: Unsupported indicator type: ${type}`);
                }
                // Store in cache if calculation was successful
                if (result) {
                     calculatedCache[cacheKey] = result;
                }
            }


            if (result) {
                neededIndicators[outputKey] = result; // Store under the specific ID's key
            } else {
                 console.warn(`Backtester: Calculation returned null/undefined for ${outputKey}`);
                 // Handle error case: fill with appropriate null structure
                 const isObjectResult = (type === 'MACD' || type === 'BB' || type === 'Stoch');
                 if (isObjectResult) {
                     let nullObject = {};
                     if (type === 'MACD') nullObject = { macd: [], signal: [], histogram: [] };
                     else if (type === 'BB') nullObject = { middle: [], upper: [], lower: [] };
                     else if (type === 'Stoch') nullObject = { k: [], d: [] };
                     Object.keys(nullObject).forEach(k => nullObject[k] = Array(marketData.length).fill(null));
                     neededIndicators[outputKey] = nullObject;
                 } else {
                     neededIndicators[outputKey] = Array(marketData.length).fill(null);
                 }
            }
        } catch (error) {
             console.error(`Backtester: Error calculating indicator ${outputKey}:`, error);
             // Fill with nulls on error (similar to above)
             const isObjectResult = (type === 'MACD' || type === 'BB' || type === 'Stoch');
             if (isObjectResult) { /* ... fill null object ... */ }
             else { neededIndicators[outputKey] = Array(marketData.length).fill(null); }
        }
    });

    return neededIndicators;
}


/**
 * Check if *all* conditions for a set of indicators are met (AND logic).
 * OR logic is handled by separate calls for entry/exit if needed, or by checking multiple condition sets.
 * For EXIT conditions, we often want ANY condition to be true (OR logic).
 *
 * @param {Array} indicatorConditions - Array of indicator config objects (e.g., strategy.longEntryIndicators).
 * @param {Object} currentData - The market data for the current candle.
 * @param {Object} previousData - The market data for the previous candle.
 * @param {Object} calculatedIndicators - Object holding calculated indicator data arrays/objects.
 * @param {number} index - The current index in the marketData array.
 * @param {boolean} useOrLogic - If true, returns true if ANY condition is met (for exits). Defaults to false (AND logic for entries).
 * @returns {boolean} True if conditions are met based on the logic type, false otherwise.
 */
function checkConditions(indicatorConditions, currentData, previousData, calculatedIndicators, index, useOrLogic = false) {
    if (!currentData || !indicatorConditions || indicatorConditions.length === 0) {
        return false; // No data or no conditions to check
    }

    // Helper for crossover checks (ensures all values are numbers)
    const isNumeric = (...vals) => vals.every(v => typeof v === 'number' && !isNaN(v));
    const crossedAbove = (val1, val2, prevVal1, prevVal2) => isNumeric(val1, val2, prevVal1, prevVal2) && prevVal1 <= prevVal2 && val1 > val2;
    const crossedBelow = (val1, val2, prevVal1, prevVal2) => isNumeric(val1, val2, prevVal1, prevVal2) && prevVal1 >= prevVal2 && val1 < val2;

    let overallResult = useOrLogic ? false : true; // Initial state depends on logic

    for (const condition of indicatorConditions) {
        const { id, type, condition: rule } = condition;
        // Now access indicators using the ID from the condition object
        const indicatorKey = `${type.toLowerCase()}_${id}`;
        let currentIndicatorValue = null;
        let previousIndicatorValue = null;
        let indicatorObj = null; // For MACD/BB/Stoch

        // --- Get Indicator Value(s) from calculatedIndicators ---
        const indicatorData = calculatedIndicators[indicatorKey];

        if (!indicatorData) {
             // console.warn(`Indicator data for ${indicatorKey} not found at index ${index}`);
             if (useOrLogic) continue; // For OR, skip this condition
             else return false; // For AND, missing data means failure
        }

        if (Array.isArray(indicatorData)) { // SMA, EMA, RSI (potentially pre-calculated)
            currentIndicatorValue = indicatorData[index];
            previousIndicatorValue = index > 0 ? indicatorData[index - 1] : null;
        } else if (typeof indicatorData === 'object') { // MACD, BB, Stoch
            indicatorObj = {};
            for (const key in indicatorData) {
                if (Array.isArray(indicatorData[key])) {
                    indicatorObj[`current_${key}`] = indicatorData[key][index];
                    indicatorObj[`previous_${key}`] = index > 0 ? indicatorData[key][index - 1] : null;
                }
            }
            // Set primary value for convenience if possible
            if (type === 'MACD') currentIndicatorValue = indicatorObj.current_macd;
            else if (type === 'BB') currentIndicatorValue = indicatorObj.current_middle; // Middle band often used
            else if (type === 'Stoch') currentIndicatorValue = indicatorObj.current_k; // %K is primary
        }

        // Check if essential value for the *specific rule* is available
        // This is complex, let's simplify: if primary is null, assume condition cannot be met unless rule specifically handles nulls
        let primaryValueAvailable = true;
         if (currentIndicatorValue === null || currentIndicatorValue === undefined) {
              // For object types, check if needed parts exist for the rule
               if (indicatorObj) {
                    // Example: MACD crossover needs current/prev macd/signal
                    if (rule.includes('signal') && (!isNumeric(indicatorObj.current_macd, indicatorObj.current_signal, indicatorObj.previous_macd, indicatorObj.previous_signal))) primaryValueAvailable = false;
                    else if (rule.includes('zero') && (!isNumeric(indicatorObj.current_macd, indicatorObj.previous_macd))) primaryValueAvailable = false;
                    // Add similar checks for BB, Stoch rules...
               } else {
                    primaryValueAvailable = false; // Not an object and primary value is null
               }
         }


        if (!primaryValueAvailable) {
            // console.log(`Required value for condition ${indicatorKey} rule '${rule}' missing at index ${index}.`);
            if (useOrLogic) continue; // Skip this condition for OR logic
            else return false; // Fail for AND logic
        }


        // --- Evaluate Condition Rule ---
        const currentPrice = currentData.close;
        const previousPrice = previousData?.close;
        let conditionMet = false; // Result for this specific condition

        switch (type) {
            case 'SMA':
            case 'EMA':
                switch (rule) {
                    case 'price_above': conditionMet = isNumeric(currentPrice, currentIndicatorValue) && currentPrice > currentIndicatorValue; break;
                    case 'price_below': conditionMet = isNumeric(currentPrice, currentIndicatorValue) && currentPrice < currentIndicatorValue; break;
                    case 'price_cross_above': conditionMet = crossedAbove(currentPrice, currentIndicatorValue, previousPrice, previousIndicatorValue); break;
                    case 'price_cross_below': conditionMet = crossedBelow(currentPrice, currentIndicatorValue, previousPrice, previousIndicatorValue); break;
                    default: console.warn(`Unsupported ${type} condition: ${rule}`);
                }
                break;

            case 'RSI':
                 const rsiOverbought = condition.overbought ?? 70; // Use default if missing
                 const rsiOversold = condition.oversold ?? 30;
                 // Determine threshold based on rule context (a bit heuristic)
                 const isCrossing = rule.includes('cross');
                 const isAboveRule = rule.includes('above');
                 const isBelowRule = rule.includes('below');
                 const rsiThreshold = isAboveRule ? rsiOverbought : (isBelowRule ? rsiOversold : (isCrossing ? 50 : null)); // Default cross threshold to 50? Risky. Needs better rule definition.

                 switch (rule) {
                    case 'above_threshold': conditionMet = isNumeric(currentIndicatorValue) && currentIndicatorValue > rsiOverbought; break;
                    case 'below_threshold': conditionMet = isNumeric(currentIndicatorValue) && currentIndicatorValue < rsiOversold; break;
                    // For crossing, explicitly use overbought for 'above', oversold for 'below' crossing target
                    case 'cross_above_threshold': conditionMet = crossedAbove(currentIndicatorValue, rsiOverbought, previousIndicatorValue, rsiOverbought); break;
                    case 'cross_below_threshold': conditionMet = crossedBelow(currentIndicatorValue, rsiOversold, previousIndicatorValue, rsiOversold); break;
                    default: console.warn(`Unsupported RSI condition: ${rule}`);
                 }
                 break;

            case 'MACD':
                 if (!indicatorObj) { conditionMet = false; break; }
                 const { current_macd: macdVal, current_signal: signalVal, previous_macd: prevMacdVal, previous_signal: prevSignalVal } = indicatorObj;
                 switch (rule) {
                    case 'cross_above_signal': conditionMet = crossedAbove(macdVal, signalVal, prevMacdVal, prevSignalVal); break;
                    case 'cross_below_signal': conditionMet = crossedBelow(macdVal, signalVal, prevMacdVal, prevSignalVal); break;
                    case 'above_zero': conditionMet = isNumeric(macdVal) && macdVal > 0; break;
                    case 'below_zero': conditionMet = isNumeric(macdVal) && macdVal < 0; break;
                    case 'cross_above_zero': conditionMet = crossedAbove(macdVal, 0, prevMacdVal, 0); break;
                    case 'cross_below_zero': conditionMet = crossedBelow(macdVal, 0, prevMacdVal, 0); break;
                    default: console.warn(`Unsupported MACD condition: ${rule}`);
                 }
                 break;

            case 'BB':
                 if (!indicatorObj) { conditionMet = false; break; }
                 const { current_upper: upperBand, current_lower: lowerBand, previous_upper: prevUpperBand, previous_lower: prevLowerBand } = indicatorObj;
                 switch (rule) {
                    case 'price_above_upper': conditionMet = isNumeric(currentPrice, upperBand) && currentPrice > upperBand; break;
                    case 'price_below_lower': conditionMet = isNumeric(currentPrice, lowerBand) && currentPrice < lowerBand; break;
                    case 'price_cross_upper': conditionMet = crossedAbove(currentPrice, upperBand, previousPrice, prevUpperBand); break;
                    case 'price_cross_lower': conditionMet = crossedBelow(currentPrice, lowerBand, previousPrice, prevLowerBand); break;
                    default: console.warn(`Unsupported BB condition: ${rule}`);
                 }
                 break;

            case 'Stoch':
                 if (!indicatorObj) { conditionMet = false; break; }
                 const { current_k: kVal, current_d: dVal, previous_k: prevKVal, previous_d: prevDVal } = indicatorObj;
                 const stochOverbought = 80; // Hardcoded common levels
                 const stochOversold = 20;
                 // Determine threshold based on rule context
                 const stochThreshold = rule.includes('above') ? stochOverbought : (rule.includes('below') ? stochOversold : null);

                 switch(rule) {
                    case 'k_cross_above_d': conditionMet = crossedAbove(kVal, dVal, prevKVal, prevDVal); break;
                    case 'k_cross_below_d': conditionMet = crossedBelow(kVal, dVal, prevKVal, prevDVal); break;
                    case 'k_above_d': conditionMet = isNumeric(kVal, dVal) && kVal > dVal; break;
                    case 'k_below_d': conditionMet = isNumeric(kVal, dVal) && kVal < dVal; break;
                    case 'k_above_threshold': conditionMet = isNumeric(kVal) && kVal > stochOverbought; break;
                    case 'k_below_threshold': conditionMet = isNumeric(kVal) && kVal < stochOversold; break;
                    // Crossing specific thresholds
                    case 'k_cross_above_threshold': conditionMet = crossedAbove(kVal, stochOverbought, prevKVal, stochOverbought); break;
                    case 'k_cross_below_threshold': conditionMet = crossedBelow(kVal, stochOversold, prevKVal, stochOversold); break;
                    default: console.warn(`Unsupported Stoch condition: ${rule}`);
                }
                break;

            default:
                console.warn(`Unsupported indicator type in checkConditions: ${type}`);
        }

        // --- Update Overall Result based on Logic ---
        if (useOrLogic) {
            if (conditionMet) return true; // For OR, first true condition is enough
        } else { // AND logic
            if (!conditionMet) return false; // For AND, first false condition means failure
        }
    } // End loop through conditions

    // If loop completes:
    // - For OR: no condition was met, return false.
    // - For AND: all conditions were met, return true.
    return useOrLogic ? false : true;
}


/**
 * Calculate performance metrics based on trade results and equity curve.
 * @param {Array} trades - List of completed trade objects.
 * @param {number} initialCapital - Starting capital.
 * @param {Array} equityCurve - Array of {date, equity} objects.
 * @param {number} totalCandles - Total number of candles in the data (for annualization).
 * @returns {Object} Performance metrics.
 */
function calculatePerformanceMetrics(trades, initialCapital, equityCurve, totalCandles) {
    const totalTrades = trades.length;
    // Ensure equityCurve has at least the starting point
    if (!equityCurve || equityCurve.length === 0) {
         equityCurve = [{ date: "Start", equity: initialCapital }];
    }
     // Ensure the last point reflects the final capital after all trades
     const finalCapital = equityCurve[equityCurve.length - 1].equity;


    if (totalTrades === 0) {
        return {
            totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: '0.00',
            grossProfit: '0.00', grossLoss: '0.00', profitFactor: 'N/A', netProfit: '0.00',
            maxDrawdown: '0.00', sharpeRatio: 'N/A', equityData: equityCurve, finalCapital: initialCapital,
        };
    }

    const winningTrades = trades.filter(t => t.profit > 0).length;
    const losingTrades = totalTrades - winningTrades;
    const winRate = ((winningTrades / totalTrades) * 100).toFixed(2);

    const grossProfit = trades
        .filter(t => t.profit > 0)
        .reduce((sum, trade) => sum + trade.profit, 0);

    const grossLoss = trades
        .filter(t => t.profit < 0)
        .reduce((sum, trade) => sum + Math.abs(trade.profit), 0);

    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? 'Infinity' : 'N/A');
    const netProfit = (grossProfit - grossLoss); // Keep as number for calculations

    // Calculate Max Drawdown from Equity Curve
    let peakEquity = initialCapital;
    let maxDrawdown = 0;
    equityCurve.forEach(point => {
        peakEquity = Math.max(peakEquity, point.equity);
        const drawdown = peakEquity > 0 ? ((peakEquity - point.equity) / peakEquity) * 100 : 0;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    // --- Sharpe Ratio Calculation (Improved slightly) ---
    let sharpeRatio = 'N/A';
    // Calculate percentage returns per trade relative to capital *at entry* if possible
    const tradeReturns = trades.map(trade => {
        // Use entryValue (capital allocated) if available, else approximate with capital before trade
        // This is still an approximation. A better way tracks capital before each trade.
        const capitalBeforeTrade = trade.entryValue || (equityCurve.find(p => p.date === trade.entryDate)?.equity || initialCapital);
        return capitalBeforeTrade > 0 ? trade.profit / capitalBeforeTrade : 0;
    });

    if (tradeReturns.length > 1) {
         const meanReturn = tradeReturns.reduce((sum, r) => sum + r, 0) / tradeReturns.length;
         // Standard deviation of trade returns
         const stdDev = Math.sqrt(tradeReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (tradeReturns.length - 1));

         // Annualize (assuming 252 trading days/year - adjust if timeframe is different!)
         // A better annualization factor would depend on the data timeframe (e.g., 52 for weekly)
         const annualizationFactor = 252; // TODO: Make this dynamic based on timeframe?
         const avgTradesPerYear = totalTrades / (totalCandles / annualizationFactor);
         const annualizedStdDev = stdDev * Math.sqrt(avgTradesPerYear); // Scale volatility by trade frequency

         // Calculate annualized return from overall P/L
         const totalReturn = (finalCapital - initialCapital) / initialCapital;
         const years = Math.max(totalCandles / annualizationFactor, 1 / annualizationFactor); // Avoid division by zero
         // Geometric annual return is better: Math.pow(1 + totalReturn, 1 / years) - 1;
         // Using arithmetic mean for simplicity here, matching std dev calc:
         const annualizedReturn = meanReturn * avgTradesPerYear;


        // Sharpe Ratio (Risk-Free Rate assumed 0)
        if (annualizedStdDev > 0) {
            sharpeRatio = (annualizedReturn / annualizedStdDev).toFixed(2);
        }
    }
    // --- End Sharpe Ratio ---


    return {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        grossProfit: grossProfit.toFixed(2),
        grossLoss: grossLoss.toFixed(2),
        profitFactor,
        netProfit: netProfit.toFixed(2), // Format as string for display
        maxDrawdown: maxDrawdown.toFixed(2),
        sharpeRatio,
        equityData: equityCurve, // Include equity curve data for charting
        finalCapital: finalCapital.toFixed(2) // Include final capital
    };
}


// --- Main Backtest Execution ---

/**
 * Run a backtest simulation with the provided strategy and market data.
 *
 * @param {Object} strategy - The trading strategy configuration.
 * @param {Array} marketData - Historical price data (must include date, open, high, low, close).
 * @returns {Promise<Object>} Backtest results including performance metrics and trade history.
 */
export const runBacktest = async (strategy, marketData) => {
    console.log("Backtester: Starting backtest simulation...");
    const startTime = performance.now();

    if (!marketData || marketData.length < 2) {
        console.error("Backtester: Not enough market data provided.");
        throw new Error("Insufficient market data provided for backtesting (need at least 2 data points).");
    }
     if (!strategy) {
        console.error("Backtester: No strategy provided.");
        throw new Error("Strategy configuration is missing.");
    }

    // 1. Calculate needed indicators
    const calculatedIndicators = calculateNeededIndicators(strategy, marketData);
    // console.log("Backtester: Calculated Indicators", calculatedIndicators);


    // 2. Initialize Simulation State
    let currentCapital = strategy.initialCapital || 10000; // Use default if missing
    const trades = [];
    // Initialize equity curve with the first valid date
    const firstValidDate = marketData[0]?.date || new Date().toISOString();
    let equityCurve = [{ date: firstValidDate, equity: currentCapital }];

    let inPosition = false;
    let positionType = null; // 'LONG' or 'SHORT'
    let entryPrice = 0;
    let entryIndex = -1;
    let positionSizeShares = 0; // Number of shares/contracts
    let entryValue = 0; // Capital value at entry
    let tradeIdCounter = 1;

    const stopLossPercent = (strategy.stopLoss || 0) / 100; // Handle potentially undefined SL/TP
    const takeProfitPercent = (strategy.takeProfit || 0) / 100;
    const positionSizePercent = (strategy.positionSize || 10) / 100; // Default to 10%

    // --- Sanity Checks ---
    if (positionSizePercent <= 0) {
        console.error("Backtester: Position Size must be greater than 0.");
        throw new Error("Invalid Position Size configuration (must be > 0%).");
    }
    if (currentCapital <= 0) {
        console.error("Backtester: Initial Capital must be greater than 0.");
        throw new Error("Invalid Initial Capital configuration (must be > 0).");
    }


    // 3. Simulation Loop
    console.log(`Backtester: Starting simulation loop for ${marketData.length} candles...`);
    for (let i = 1; i < marketData.length; i++) { // Start from 1 to have previous data
        const currentData = marketData[i];
        const previousData = marketData[i - 1];

        // Basic data validation for the current candle
        if (!currentData || currentData.close === null || currentData.close === undefined ||
            currentData.high === null || currentData.high === undefined ||
            currentData.low === null || currentData.low === undefined ||
            currentData.date === null || currentData.date === undefined) {
             console.warn(`Backtester: Skipping candle at index ${i} due to missing data.`);
             // Update equity curve with previous capital if date changed
            if (currentData?.date && equityCurve[equityCurve.length - 1].date !== currentData.date) {
                equityCurve.push({ date: currentData.date, equity: currentCapital });
            }
             continue;
         }

        let exitSignal = false;
        let exitPrice = currentData.close; // Default exit price
        let exitReason = "";

        // --- A. Exit Logic (Check before entry) ---
        if (inPosition) {
            const currentHigh = currentData.high;
            const currentLow = currentData.low;
            let stopPrice = 0;
            let targetPrice = 0;

            if (positionType === 'LONG') {
                // 1. Check Stop Loss
                if (stopLossPercent > 0) {
                    stopPrice = entryPrice * (1 - stopLossPercent);
                    if (currentLow <= stopPrice) {
                        exitSignal = true;
                        exitPrice = stopPrice; // Assume SL filled exactly
                        exitReason = "Stop Loss";
                    }
                }
                // 2. Check Take Profit (only if SL not hit)
                if (!exitSignal && takeProfitPercent > 0) {
                    targetPrice = entryPrice * (1 + takeProfitPercent);
                    if (currentHigh >= targetPrice) {
                        exitSignal = true;
                        exitPrice = targetPrice; // Assume TP filled exactly
                        exitReason = "Take Profit";
                    }
                }
                // 3. Check Indicator Exit Conditions (only if SL/TP not hit)
                // Exit conditions use OR logic (any single condition triggers exit)
                if (!exitSignal && strategy.longEnabled && checkConditions(strategy.longExitIndicators, currentData, previousData, calculatedIndicators, i, true)) {
                    exitSignal = true;
                    exitPrice = currentData.close; // Exit on close for indicator signal
                    exitReason = "Indicator Exit";
                }
            } else { // SHORT position
                // 1. Check Stop Loss
                if (stopLossPercent > 0) {
                    stopPrice = entryPrice * (1 + stopLossPercent);
                     if (currentHigh >= stopPrice) {
                        exitSignal = true;
                        exitPrice = stopPrice; // Assume SL filled exactly
                        exitReason = "Stop Loss";
                    }
                }
                // 2. Check Take Profit (only if SL not hit)
                if (!exitSignal && takeProfitPercent > 0) {
                    targetPrice = entryPrice * (1 - takeProfitPercent);
                    if (currentLow <= targetPrice) {
                        exitSignal = true;
                        exitPrice = targetPrice; // Assume TP filled exactly
                        exitReason = "Take Profit";
                    }
                }
                // 3. Check Indicator Exit Conditions (only if SL/TP not hit)
                // Exit conditions use OR logic
                if (!exitSignal && strategy.shortEnabled && checkConditions(strategy.shortExitIndicators, currentData, previousData, calculatedIndicators, i, true)) {
                    exitSignal = true;
                    exitPrice = currentData.close; // Exit on close for indicator signal
                    exitReason = "Indicator Exit";
                }
            }

            // --- B. Process Exit ---
            if (exitSignal || i === marketData.length - 1) { // Force exit on last candle if still in position
                 if (i === marketData.length - 1 && !exitSignal) {
                     exitReason = "End of Data";
                     exitPrice = currentData.close;
                 }
                 // console.log(`Exit Signal: ${exitReason} at index ${i} for ${positionType}. Entry: ${entryPrice.toFixed(2)}, Exit: ${exitPrice.toFixed(2)}`);

                 const profit = positionType === 'LONG'
                    ? (exitPrice - entryPrice) * positionSizeShares
                    : (entryPrice - exitPrice) * positionSizeShares;

                 currentCapital += profit;

                 // Prevent negative capital? Optional. Some backtesters allow it.
                 // currentCapital = Math.max(0, currentCapital);

                 trades.push({
                    id: tradeIdCounter++,
                    type: positionType,
                    entry: parseFloat(entryPrice.toFixed(4)), // More precision for price
                    exit: parseFloat(exitPrice.toFixed(4)),
                    entryDate: marketData[entryIndex]?.date || 'N/A', // Add fallback
                    exitDate: currentData.date,
                    entryIndex: entryIndex,
                    exitIndex: i,
                    profit: parseFloat(profit.toFixed(2)), // Display profit rounded
                    duration: i - entryIndex,
                    entryValue: parseFloat(entryValue.toFixed(2)),
                    exitReason: exitReason,
                    positionSizeShares: parseFloat(positionSizeShares.toFixed(6)) // Store share size
                 });

                 // Update equity curve *after* closing trade for this candle
                 if (equityCurve[equityCurve.length - 1].date === currentData.date) {
                      equityCurve[equityCurve.length - 1].equity = currentCapital; // Update existing point
                 } else {
                      equityCurve.push({ date: currentData.date, equity: currentCapital });
                 }


                 // Reset position state
                 inPosition = false;
                 positionType = null;
                 entryPrice = 0;
                 entryIndex = -1;
                 positionSizeShares = 0;
                 entryValue = 0;

            } else {
                 // If still in position and date changed, update equity curve with *current* capital
                 if (equityCurve[equityCurve.length - 1].date !== currentData.date) {
                     equityCurve.push({ date: currentData.date, equity: currentCapital });
                 }
            }
        } // End of exit logic (if inPosition)

        // --- C. Entry Logic (Only if not in position *after* potential exit) ---
        if (!inPosition) {
            let entrySignal = null; // 'LONG' or 'SHORT'
            let potentialEntryPrice = currentData.close; // Assume entry on close

            // Check Long Entry Conditions (AND logic)
            if (strategy.longEnabled && checkConditions(strategy.longEntryIndicators, currentData, previousData, calculatedIndicators, i, false)) {
                entrySignal = 'LONG';
            }
            // Check Short Entry Conditions (AND logic) - only if no Long signal
            else if (strategy.shortEnabled && checkConditions(strategy.shortEntryIndicators, currentData, previousData, calculatedIndicators, i, false)) {
                entrySignal = 'SHORT';
            }

            // --- D. Process Entry ---
            if (entrySignal) {
                 // Check if enough capital to enter (basic check, ignores margin)
                 if (currentCapital <= 0) {
                     console.warn(`Backtester: Skipping ${entrySignal} entry at index ${i} due to zero/negative capital.`);
                     continue; // Skip to next candle
                 }

                // console.log(`Entry Signal: ${entrySignal} at index ${i}. Price: ${potentialEntryPrice.toFixed(2)}`);
                inPosition = true;
                positionType = entrySignal;
                entryPrice = potentialEntryPrice;
                entryIndex = i;

                // Calculate position size based on available capital
                entryValue = currentCapital * positionSizePercent;
                positionSizeShares = entryValue / entryPrice;

                 // If this is a new date for the equity curve, add the point *before* the trade starts affecting P/L
                 if (equityCurve[equityCurve.length - 1].date !== currentData.date) {
                     equityCurve.push({ date: currentData.date, equity: currentCapital });
                 }
            }
        } // End of entry logic

        // --- E. Update Equity Curve if not in position and date changed ---
         if (!inPosition && equityCurve[equityCurve.length - 1].date !== currentData.date) {
              equityCurve.push({ date: currentData.date, equity: currentCapital });
         }


    } // End of simulation loop
    const endTime = performance.now();
    console.log(`Backtester: Simulation loop finished in ${(endTime - startTime).toFixed(2)} ms.`);


    // 4. Calculate Performance Metrics
    console.log("Backtester: Calculating final performance metrics...");
    const metrics = calculatePerformanceMetrics(trades, strategy.initialCapital || 10000, equityCurve, marketData.length);
    console.log("Backtester: Backtest complete. Net Profit:", metrics.netProfit, "Total Trades:", metrics.totalTrades);


    // 5. Return Results
    return {
        ...metrics, // Spread the calculated metrics (includes equityData)
        trades,
        initialCapital: strategy.initialCapital || 10000,
        strategyName: strategy.name || 'Unnamed Strategy',
        symbol: marketData[0]?.symbol || 'N/A', // Get symbol from data if available
        // Timeframe info might need to be passed into the backtester if available
        timeframe: 'N/A', // Placeholder
        startDate: marketData[0]?.date,
        endDate: marketData[marketData.length - 1]?.date,
        candlesProcessed: marketData.length,
    };
};