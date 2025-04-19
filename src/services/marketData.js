/**
 * Market data service for frontend
 * Connects to backend API only - no generated data
 */


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
      console.log('API is not available. Application requires a connection to the backend API.');
    }
  } catch (error) {
    console.log('Market data API is not available');
    console.error('Connection error:', error.message);
    apiAvailable = false;
  }
})();

/**
 * Fetch market data from API
 * 
 * @param {string} symbol - Trading symbol (e.g., 'AAPL')
 * @param {string} timeframe - Timeframe ('1d', '1w', '1M')
 * @param {number} days - Number of days of data to return
 * @returns {Promise<Array>} - Market data or empty array if API is unavailable
 * @throws {Error} - If API is unavailable or request fails
 */
export const fetchMarketData = async (symbol = 'AAPL', timeframe = '1d', days = 100) => {
  if (!apiAvailable) {
    throw new Error('Market data API is not available. Please check your connection to the backend service.');
  }

  try {
    const response = await fetch(`${API_URL}/market-data?symbol=${symbol}&timeframe=${timeframe}&days=${days}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching market data from API:', error);
    throw new Error('Failed to fetch market data. Please try again later.');
  }
};

/**
 * Fetch market data with technical indicators
 * 
 * @param {string} symbol - Trading symbol
 * @param {string} timeframe - Timeframe
 * @param {number} days - Number of days
 * @returns {Promise<Array>} - Complete market data
 * @throws {Error} - If API is unavailable or request fails
 */
export const fetchCompleteMarketData = async (symbol = 'AAPL', timeframe = '1d', days = 100) => {
  if (!apiAvailable) {
    throw new Error('Market data API is not available. Please check your connection to the backend service.');
  }

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
};

/**
 * Fetch available symbols/instruments
 * 
 * @param {string} keywords - Search terms to find relevant symbols
 * @returns {Promise<Array>} - List of trading instruments or empty array
 */
export const fetchAvailableSymbols = async (keywords = '') => {
  if (!apiAvailable) {
    console.error('Market data API is not available');
    return []; // Return empty array - no fallback to generated data
  }

  try {
    const response = await fetch(`${API_URL}/symbols?keywords=${keywords}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching symbols from API:', error);
    return []; // Return empty array - no fallback to generated data
  }
};

/**
 * Get list of available timeframes
 * 
 * @returns {Array} - Available timeframes
 */
export const generateAvailableTimeframes = () => {
  // This isn't really "generated data" in the same sense, just a static configuration
  return [
    { id: '1d', name: '1 Day' },
    { id: '1w', name: '1 Week' },
    { id: '1M', name: '1 Month' },
    { id: '3M', name: '3 Months' },
    { id: '1Y', name: '1 Year' },
    { id: 'ALL', name: 'All Time' }
  ];
};