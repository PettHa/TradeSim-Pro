/**
 * Market data service for frontend
 * Connects to backend API or uses generated test data
 */

import { generateSampleData, generateAvailableSymbols as generateFakeSymbols } from './dataGenerator';

// Get API URL from environment variables (.env)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Check if API is available
let apiAvailable = false;

// Test API availability at startup
(async function checkApiAvailability() {
  try {
    const response = await fetch(`${API_URL}/market-data?symbol=AAPL&days=1`);
    apiAvailable = response.ok;
    console.log('Market data API is', apiAvailable ? 'available' : 'not available');
    if (apiAvailable) {
      console.log('Connected to backend API at', API_URL);
    } else {
      console.log('Using generated test data');
    }
  } catch (error) {
    console.log('Market data API is not available - using test data');
    console.error('Connection error:', error.message);
    apiAvailable = false;
  }
})();

/**
 * Fetch market data from API or generate test data
 * 
 * @param {string} symbol - Trading symbol (e.g., 'AAPL')
 * @param {string} timeframe - Timeframe ('1d', '1w', '1M')
 * @param {number} days - Number of days of data to return
 * @returns {Promise<Array>} - Market data
 */
export const fetchMarketData = async (symbol = 'AAPL', timeframe = '1d', days = 100) => {
  // Try to use API if available
  if (apiAvailable) {
    try {
      const response = await fetch(`${API_URL}/market-data?symbol=${symbol}&timeframe=${timeframe}&days=${days}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching market data from API:', error);
      console.log('Falling back to generated test data');
      // Fallback to test data if API fails
      return generateSampleData(days, symbol);
    }
  } else {
    // Use generated test data if API is not available
    console.log('Using generated test data for', symbol);
    return generateSampleData(days, symbol);
  }
};

/**
 * Fetch market data with technical indicators
 * 
 * @param {string} symbol - Trading symbol
 * @param {string} timeframe - Timeframe
 * @param {number} days - Number of days
 * @returns {Promise<Array>} - Complete market data
 */
export const fetchCompleteMarketData = async (symbol = 'AAPL', timeframe = '1d', days = 100) => {
  // Try to use API if available
  if (apiAvailable) {
    try {
      const response = await fetch(`${API_URL}/complete-market-data?symbol=${symbol}&timeframe=${timeframe}&days=${days}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching complete market data from API:', error);
      // Fallback to regular market data
      return fetchMarketData(symbol, timeframe, days);
    }
  } else {
    // Use generated test data if API is not available
    return fetchMarketData(symbol, timeframe, days);
  }
};

/**
 * Fetch available symbols/instruments
 * 
 * @param {string} keywords - Search terms to find relevant symbols
 * @returns {Promise<Array>} - List of trading instruments
 */
export const fetchAvailableSymbols = async (keywords = '') => {
  // Try to use API if available
  if (apiAvailable) {
    try {
      const response = await fetch(`${API_URL}/symbols?keywords=${keywords}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching symbols from API:', error);
      // Fallback to test data
      return generateFakeSymbols();
    }
  } else {
    // Use generated symbols if API is not available
    return generateFakeSymbols();
  }
};

/**
 * Generate list of available timeframes
 * 
 * @returns {Array} - Available timeframes
 */
export const generateAvailableTimeframes = () => {
  return [
    { id: '1d', name: '1 Day' },
    { id: '1w', name: '1 Week' },
    { id: '1M', name: '1 Month' },
    { id: '3M', name: '3 Months' },
    { id: '1Y', name: '1 Year' },
    { id: 'ALL', name: 'All Time' }
  ];
};