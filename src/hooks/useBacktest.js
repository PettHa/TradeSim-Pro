import { useState, useCallback } from 'react';
import { runBacktest } from '../services/backtester';

/**
 * Custom hook for managing backtest state and execution
 * 
 * @param {Object} initialStrategy - Initial trading strategy configuration
 * @returns {Object} Backtest state and functions
 */
const useBacktest = (initialStrategy) => {
  const [strategy, setStrategy] = useState(initialStrategy);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Update strategy configuration
   * 
   * @param {Object|Function} updatedStrategy - Updated strategy object or update function
   */
  const updateStrategy = useCallback((updatedStrategy) => {
    setStrategy((prev) => {
      if (typeof updatedStrategy === 'function') {
        return updatedStrategy(prev);
      }
      return { ...prev, ...updatedStrategy };
    });
  }, []);
  
  /**
   * Execute the backtest with current strategy settings
   * 
   * @param {Array} marketData - Historical price data
   */
  const executeBacktest = useCallback(async (marketData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await runBacktest(strategy, marketData);
      setResults(result);
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred during backtesting');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [strategy]);
  
  /**
   * Reset backtest results and errors
   */
  const resetBacktest = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);
  
  /**
   * Reset everything to initial state
   * 
   * @param {Object} [defaultStrategy] - Optional new default strategy
   */
  const resetAll = useCallback((defaultStrategy = initialStrategy) => {
    setStrategy(defaultStrategy);
    setResults(null);
    setError(null);
  }, [initialStrategy]);
  
  return {
    strategy,
    results,
    isLoading,
    error,
    updateStrategy,
    executeBacktest,
    resetBacktest,
    resetAll
  };
};

export default useBacktest;