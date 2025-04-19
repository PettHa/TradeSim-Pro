/**
 * Trading strategy backtester service
 * 
 * This service simulates trading based on a strategy configuration and market data
 */

import { calculateSMA, calculateRSI, calculateMACD } from '../utils/indicators';

/**
 * Run a backtest simulation with the provided strategy and market data
 * 
 * @param {Object} strategy - The trading strategy configuration
 * @param {Array} marketData - Historical price data
 * @returns {Object} Backtest results including performance metrics and trade history
 */
export const runBacktest = async (strategy, marketData) => {
  // In a real application, this would be a much more comprehensive implementation
  // or potentially an API call to a backend service
  
  // Simulating async processing
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate sample backtest results
      // In a real app, this would be calculated based on the strategy rules
      resolve(generateResults(strategy, marketData));
    }, 1500);
  });
};

/**
 * Generate backtest results (sample implementation)
 */
const generateResults = (strategy, marketData) => {
  // Calculate indicators based on strategy configuration
  const indicators = calculateIndicators(strategy, marketData);
  
  // Execute strategy rules to generate trades
  const trades = executeTrades(strategy, marketData, indicators);
  
  // Calculate performance metrics
  const metrics = calculatePerformanceMetrics(trades, strategy.initialCapital);
  
  return {
    ...metrics,
    trades,
    initialCapital: strategy.initialCapital
  };
};

/**
 * Calculate technical indicators based on strategy configuration
 */
const calculateIndicators = (strategy, marketData) => {
  const indicators = {};
  
  // Extract all unique indicators from strategy configuration
  const allIndicators = [
    ...strategy.longEntryIndicators,
    ...strategy.longExitIndicators,
    ...strategy.shortEntryIndicators,
    ...strategy.shortExitIndicators
  ];
  
  // Calculate each indicator only once
  allIndicators.forEach(indicator => {
    const { type, id } = indicator;
    
    if (type === 'SMA' && !indicators[`sma_${id}`]) {
      indicators[`sma_${id}`] = calculateSMA(
        marketData.map(d => d.price),
        indicator.period
      );
    }
    
    if (type === 'RSI' && !indicators[`rsi_${id}`]) {
      indicators[`rsi_${id}`] = calculateRSI(
        marketData.map(d => d.price),
        indicator.period
      );
    }
    
    if (type === 'MACD' && !indicators[`macd_${id}`]) {
      indicators[`macd_${id}`] = calculateMACD(
        marketData.map(d => d.price),
        indicator.fastPeriod,
        indicator.slowPeriod,
        indicator.signalPeriod
      );
    }
  });
  
  return indicators;
};

/**
 * Execute trades based on strategy rules and indicators
 */
const executeTrades = (strategy, marketData, indicators) => {
  // In a real application, this would apply the strategy rules to the historical data
  // and generate a list of trades
  
  // For this demo, we'll generate sample trades
  const sampleTrades = [];
  let tradeId = 1;
  
  // Generate some sample trades
  for (let i = 20; i < marketData.length - 5; i += 7) {
    const isLong = Math.random() > 0.4;
    const entryPrice = marketData[i].price;
    const exitIndex = i + Math.floor(Math.random() * 5) + 1;
    const exitPrice = marketData[exitIndex].price;
    
    // Apply random slippage
    const entryWithSlippage = entryPrice * (1 + (Math.random() - 0.5) * 0.002);
    const exitWithSlippage = exitPrice * (1 + (Math.random() - 0.5) * 0.002);
    
    // Calculate profit based on direction
    const profit = isLong 
      ? exitWithSlippage - entryWithSlippage
      : entryWithSlippage - exitWithSlippage;
    
    // Convert to dollar value (assuming 1 contract/share for simplicity)
    const profitAmount = profit * 100;
    
    sampleTrades.push({
      id: tradeId++,
      type: isLong ? 'LONG' : 'SHORT',
      entry: parseFloat(entryWithSlippage.toFixed(2)),
      exit: parseFloat(exitWithSlippage.toFixed(2)),
      entryDate: marketData[i].date,
      exitDate: marketData[exitIndex].date,
      date: marketData[i].date,
      profit: parseFloat(profitAmount.toFixed(2)),
      duration: exitIndex - i
    });
  }
  
  return sampleTrades;
};

/**
 * Calculate performance metrics based on trade results
 */
const calculatePerformanceMetrics = (trades, initialCapital) => {
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.profit > 0).length;
  const losingTrades = trades.filter(t => t.profit < 0).length;
  
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(2) : 0;
  
  const grossProfit = trades
    .filter(t => t.profit > 0)
    .reduce((sum, trade) => sum + trade.profit, 0);
  
  const grossLoss = trades
    .filter(t => t.profit < 0)
    .reduce((sum, trade) => sum + Math.abs(trade.profit), 0);
  
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : 0;
  
  const netProfit = trades.reduce((sum, trade) => sum + trade.profit, 0).toFixed(2);
  
  // Calculate equity curve and max drawdown
  let maxDrawdown = 0;
  let peak = initialCapital;
  let equity = initialCapital;
  
  trades.forEach(trade => {
    equity += trade.profit;
    
    if (equity > peak) {
      peak = equity;
    }
    
    const drawdown = ((peak - equity) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  
  // Calculate annualized return and volatility for Sharpe ratio
  const annualizedReturn = (netProfit / initialCapital) * 100 * (252 / totalTrades);
  const returns = trades.map(t => t.profit / initialCapital);
  const stdDev = calculateStandardDeviation(returns);
  const annualizedVolatility = stdDev * Math.sqrt(252);
  const sharpeRatio = annualizedVolatility > 0 ? (annualizedReturn / annualizedVolatility).toFixed(2) : 0;
  
  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    grossProfit,
    grossLoss,
    profitFactor,
    netProfit,
    maxDrawdown: maxDrawdown.toFixed(2),
    sharpeRatio
  };
};

/**
 * Calculate standard deviation of an array of values
 */
const calculateStandardDeviation = (values) => {
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
};