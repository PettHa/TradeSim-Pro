/**
 * Market data service using Alpha Vantage API
 * with local CSV file caching
 * 
 * NOTE: You need to register at https://www.alphavantage.co/ to get an API key
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env file from root (two directories up)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

// Get API key from .env file
const API_KEY = process.env['ALPHAVANTAGE_KEY'];
if (!API_KEY) {
  console.error('WARNING: ALPHAVANTAGE_KEY not found in .env file');
}

const BASE_URL = 'https://www.alphavantage.co/query';

// Define data storage directory
const DATA_DIR = path.join(__dirname, 'market_data');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory: ${DATA_DIR}`);
}

/**
 * Fetch market data from API and save as CSV
 * 
 * @param {string} symbol - Trading symbol (e.g., 'AAPL')
 * @param {string} timeframe - Timeframe ('1d', '1w', '1M')
 * @param {number} days - Number of days of data to return
 * @returns {Promise<Array>} - Market data
 */
export const fetchMarketData = async (symbol = 'AAPL', timeframe = '1d', days = 100) => {
  const cacheFilePath = path.join(DATA_DIR, `${symbol}_${timeframe}.csv`);
  
  // Check if we have cached data less than 24 hours old
  if (fs.existsSync(cacheFilePath)) {
    const stats = fs.statSync(cacheFilePath);
    const fileAge = Date.now() - stats.mtimeMs;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    if (fileAge < ONE_DAY) {
      return loadDataFromCSV(cacheFilePath, days);
    }
  }
  
  try {
    // Map timeframe ID to Alpha Vantage function
    const avTimeframe = mapTimeframeToAV(timeframe);
    
    // Construct URL
    const url = `${BASE_URL}?function=${avTimeframe}&symbol=${symbol}&apikey=${API_KEY}&outputsize=full`;
    console.log(`Fetching data from Alpha Vantage: ${url.replace(API_KEY, 'API_KEY_HIDDEN')}`);
    
    // Fetch data
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Better debugging for API response
    console.log('Alpha Vantage API response keys:', Object.keys(data));
    
    // Check for error messages from Alpha Vantage
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    // Check for rate limit warnings
    if (data['Note']) {
      console.warn('Alpha Vantage API limit note:', data['Note']);
      // Continue as this is just a warning
    }
    
    // Process the data - find the correct time series key
    let timeSeries = null;
    let timeSeriesKey = '';

    // Check all possible time series keys
    const possibleKeys = [
      `Time Series (${getTimeSeriesLabel(avTimeframe)})`,
      'Monthly Time Series',
      'Weekly Time Series',
      'Time Series (Daily)'
    ];

    for (const key of possibleKeys) {
      if (data[key]) {
        timeSeries = data[key];
        timeSeriesKey = key;
        console.log(`Found time series with key: ${key}`);
        break;
      }
    }

    if (!timeSeries) {
      console.error('Unexpected API response format. Full response keys:', Object.keys(data));
      console.error('Response sample:', JSON.stringify(data).substring(0, 500) + '...');
      throw new Error('Unexpected API response format');
    }
    
    // Convert the data to our desired format
    const formattedData = [];
    const dates = Object.keys(timeSeries).sort();
    
    for (const date of dates) {
      const dayData = timeSeries[date];
      
      formattedData.push({
        date: date,
        symbol: symbol,
        open: parseFloat(dayData['1. open']),
        high: parseFloat(dayData['2. high']),
        low: parseFloat(dayData['3. low']),
        close: parseFloat(dayData['4. close']),
        price: parseFloat(dayData['4. close']), // For compatibility
        volume: parseInt(dayData['5. volume']),
        sma20: null,
        rsi: null
      });
    }
    
    // Save data as CSV
    saveDataToCSV(cacheFilePath, formattedData);
    
    // Return only the requested number of days
    return formattedData.slice(0, days).reverse(); // Reverse for chronological order
  } catch (error) {
    console.error('Error fetching market data:', error);
    
    // Try to read from cached data if API call fails
    if (fs.existsSync(cacheFilePath)) {
      console.log(`Using previously cached data for ${symbol}`);
      return loadDataFromCSV(cacheFilePath, days);
    }
    
    // If no cached data is available, generate sample data
    console.log(`No cached data available, generating sample data for ${symbol}`);
    return generateSampleData(days, symbol);
  }
};

/**
 * Fetch technical indicators (SMA)
 * 
 * @param {string} symbol - Trading symbol
 * @returns {Promise<Array>} - SMA data
 */
export const fetchSMA = async (symbol = 'AAPL') => {
  const cacheFilePath = path.join(DATA_DIR, `${symbol}_sma20.csv`);
  
  // Check if we have cached data less than 24 hours old
  if (fs.existsSync(cacheFilePath)) {
    const stats = fs.statSync(cacheFilePath);
    const fileAge = Date.now() - stats.mtimeMs;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    if (fileAge < ONE_DAY) {
      return loadDataFromCSV(cacheFilePath);
    }
  }
  
  try {
    const url = `${BASE_URL}?function=SMA&symbol=${symbol}&interval=daily&time_period=20&series_type=close&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process SMA data
    const technicalData = data['Technical Analysis: SMA'];
    
    if (!technicalData) {
      console.error('Unexpected API response format for SMA. Full response:', JSON.stringify(data, null, 2));
      throw new Error('Unexpected API response format for SMA');
    }
    
    const smaData = [];
    
    for (const date in technicalData) {
      smaData.push({
        date: date,
        sma20: parseFloat(technicalData[date]['SMA'])
      });
    }
    
    // Save data as CSV
    saveDataToCSV(cacheFilePath, smaData);
    
    return smaData;
  } catch (error) {
    console.error('Error fetching SMA data:', error);
    
    // Try to read from cached data if API call fails
    if (fs.existsSync(cacheFilePath)) {
      console.log(`Using previously cached SMA data for ${symbol}`);
      return loadDataFromCSV(cacheFilePath);
    }
    
    // If no cached data, return empty array
    return [];
  }
};

/**
 * Fetch technical indicators (RSI)
 * 
 * @param {string} symbol - Trading symbol
 * @returns {Promise<Array>} - RSI data
 */
export const fetchRSI = async (symbol = 'AAPL') => {
  const cacheFilePath = path.join(DATA_DIR, `${symbol}_rsi.csv`);
  
  // Check if we have cached data less than 24 hours old
  if (fs.existsSync(cacheFilePath)) {
    const stats = fs.statSync(cacheFilePath);
    const fileAge = Date.now() - stats.mtimeMs;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    if (fileAge < ONE_DAY) {
      return loadDataFromCSV(cacheFilePath);
    }
  }
  
  try {
    const url = `${BASE_URL}?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process RSI data
    const technicalData = data['Technical Analysis: RSI'];
    
    if (!technicalData) {
      console.error('Unexpected API response format for RSI. Full response:', JSON.stringify(data, null, 2));
      throw new Error('Unexpected API response format for RSI');
    }
    
    const rsiData = [];
    
    for (const date in technicalData) {
      rsiData.push({
        date: date,
        rsi: parseFloat(technicalData[date]['RSI'])
      });
    }
    
    // Save data as CSV
    saveDataToCSV(cacheFilePath, rsiData);
    
    return rsiData;
  } catch (error) {
    console.error('Error fetching RSI data:', error);
    
    // Try to read from cached data if API call fails
    if (fs.existsSync(cacheFilePath)) {
      console.log(`Using previously cached RSI data for ${symbol}`);
      return loadDataFromCSV(cacheFilePath);
    }
    
    // If no cached data, return empty array
    return [];
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
  try {
    // Fetch base market data
    const marketData = await fetchMarketData(symbol, timeframe, days);
    
    // Fetch technical indicators
    let smaData = [];
    let rsiData = [];
    
    try {
      smaData = await fetchSMA(symbol);
    } catch (error) {
      console.warn('Error fetching SMA data, proceeding without it:', error.message);
    }
    
    try {
      rsiData = await fetchRSI(symbol);
    } catch (error) {
      console.warn('Error fetching RSI data, proceeding without it:', error.message);
    }
    
    // Create maps for easier lookups
    const smaMap = new Map();
    smaData.forEach(item => smaMap.set(item.date, item.sma20));
    
    const rsiMap = new Map();
    rsiData.forEach(item => rsiMap.set(item.date, item.rsi));
    
    // Merge the data
    const completeData = marketData.map(item => ({
      ...item,
      sma20: smaMap.get(item.date) || null,
      rsi: rsiMap.get(item.date) || null
    }));
    
    // Save the combined data
    const combinedFilePath = path.join(DATA_DIR, `${symbol}_${timeframe}_complete.csv`);
    saveDataToCSV(combinedFilePath, completeData);
    
    return completeData;
  } catch (error) {
    console.error('Error fetching complete market data:', error);
    // Return basic market data if combining fails
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
  const cacheFilePath = path.join(DATA_DIR, `symbols_${keywords.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  
  if (fs.existsSync(cacheFilePath)) {
    const stats = fs.statSync(cacheFilePath);
    const fileAge = Date.now() - stats.mtimeMs;
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // Symbols don't change often
    
    if (fileAge < ONE_WEEK) {
      return loadDataFromCSV(cacheFilePath);
    }
  }
  
  try {
    if (!keywords) {
      // If no keywords, use default symbols
      const defaultSymbols = getDefaultSymbols();
      saveDataToCSV(path.join(DATA_DIR, 'symbols_default.csv'), defaultSymbols);
      return defaultSymbols;
    }
    
    const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API errors
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    // Process symbols data
    const matches = data.bestMatches || [];
    
    if (!matches || !Array.isArray(matches)) {
      console.error('Unexpected API response format for symbol search. Full response:', JSON.stringify(data, null, 2));
      throw new Error('Unexpected API response format for symbol search');
    }
    
    const symbols = matches.map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: getSymbolType(match['3. type']),
      region: match['4. region'],
      currency: match['8. currency']
    }));
    
    // Save symbols
    saveDataToCSV(cacheFilePath, symbols);
    
    return symbols;
  } catch (error) {
    console.error('Error fetching available symbols:', error);
    
    // Try to read from cached data if API call fails
    if (fs.existsSync(cacheFilePath)) {
      console.log(`Using previously cached symbols for search: ${keywords}`);
      return loadDataFromCSV(cacheFilePath);
    }
    
    // Return default symbols as a last resort
    const defaultSymbols = getDefaultSymbols();
    return defaultSymbols;
  }
};

/**
 * Generate list of available timeframes
 * 
 * @returns {Array} - Available timeframes
 */
export const generateAvailableTimeframes = () => {
  const timeframes = [
    { id: '1d', name: '1 Day' },
    { id: '1w', name: '1 Week' },
    { id: '1M', name: '1 Month' },
  ];
  
  // Save as CSV for consistency
  saveDataToCSV(path.join(DATA_DIR, 'timeframes.csv'), timeframes);
  
  return timeframes;
};

// Helper functions

/**
 * Maps application timeframe ID to Alpha Vantage function
 */
function mapTimeframeToAV(timeframe) {
  switch (timeframe) {
    case '1d':
      return 'TIME_SERIES_DAILY';
    case '1w':
      return 'TIME_SERIES_WEEKLY';
    case '1M':
      return 'TIME_SERIES_MONTHLY';
    default:
      return 'TIME_SERIES_DAILY';
  }
}

/**
 * Gets the correct label for time series based on the function
 */
function getTimeSeriesLabel(avTimeframe) {
  switch (avTimeframe) {
    case 'TIME_SERIES_DAILY':
      return 'Daily';
    case 'TIME_SERIES_WEEKLY':
      return 'Weekly';
    case 'TIME_SERIES_MONTHLY':
      return 'Monthly';
    default:
      return 'Daily';
  }
}

/**
 * Maps Alpha Vantage symbol type to application format
 */
function getSymbolType(avType) {
  switch (avType) {
    case 'Equity':
      return 'stock';
    case 'ETF':
      return 'etf';
    case 'Currency':
      return 'forex';
    case 'Crypto':
      return 'crypto';
    case 'Future':
      return 'futures';
    default:
      return avType.toLowerCase();
  }
}

/**
 * Default list of symbols
 */
function getDefaultSymbols() {
  return [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'stock' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock' },
    { symbol: 'META', name: 'Meta Platforms, Inc.', type: 'stock' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
    
    { symbol: 'BTCUSD', name: 'Bitcoin', type: 'crypto' },
    { symbol: 'ETHUSD', name: 'Ethereum', type: 'crypto' },
    
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex' },
    { symbol: 'GBP/USD', name: 'British Pound / US Dollar', type: 'forex' },
    { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', type: 'forex' },
  ];
}

/**
 * Save data as CSV file
 * 
 * @param {string} filePath - Path to the file
 * @param {Array} data - Data to save
 */
function saveDataToCSV(filePath, data) {
  if (!data || data.length === 0) {
    console.warn('No data to save to', filePath);
    return;
  }
  
  try {
    // Get fields from first data object
    const fields = Object.keys(data[0]);
    
    // Create CSV header
    const header = fields.join(',');
    
    // Convert each data row to CSV
    const rows = data.map(item => {
      return fields.map(field => {
        const value = item[field];
        
        // Handle special cases
        if (value === null || value === undefined) {
          return '';
        }
        
        // Handle strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        
        return value;
      }).join(',');
    });
    
    // Combine header and rows
    const csvContent = [header, ...rows].join('\n');
    
    // Write to file
    fs.writeFileSync(filePath, csvContent, 'utf8');
    console.log(`Data saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving CSV:', error);
  }
}

/**
 * Load data from CSV file
 * 
 * @param {string} filePath - Path to the CSV file
 * @param {number} limit - Maximum number of rows to return (optional)
 * @returns {Array} - Parsed data
 */
function loadDataFromCSV(filePath, limit = null) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    if (lines.length < 2) {
      console.warn('CSV file is empty or has only headers:', filePath);
      return [];
    }
    
    // Parse header
    const header = lines[0].split(',');
    
    // Parse data rows
    const data = [];
    
    // Limit number of rows if specified
    const rowsToProcess = limit ? Math.min(lines.length - 1, limit) : lines.length - 1;
    
    for (let i = 1; i <= rowsToProcess; i++) {
      if (!lines[i] || lines[i].trim() === '') continue;
      
      const values = parseCSVLine(lines[i]);
      const item = {};
      
      for (let j = 0; j < header.length; j++) {
        const value = values[j];
        
        // Convert numeric strings to numbers
        if (!isNaN(value) && value !== '') {
          item[header[j]] = Number(value);
        } else {
          item[header[j]] = value === '' ? null : value;
        }
      }
      
      data.push(item);
    }
    
    console.log(`Loaded ${data.length} data rows from ${filePath}`);
    return data;
  } catch (error) {
    console.error('Error reading CSV:', error);
    return [];
  }
}

/**
 * Helper for handling quoted values in CSV
 * 
 * @param {string} line - A line from the CSV file
 * @returns {Array} - Parsed values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Generate sample market data
 * 
 * @param {number} days - Number of days to generate
 * @param {string} symbol - Trading symbol
 * @returns {Array} - Array of price data objects
 */
function generateSampleData(days = 100, symbol = 'DEMO') {
  const data = [];
  const today = new Date();
  let basePrice = getBasePrice(symbol);
  
  // Generate data starting from 'days' ago up to today
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add some randomness to price movement
    const changePercent = (Math.random() - 0.5) * 2; // -1% to +1%
    basePrice = basePrice * (1 + changePercent / 100);
    
    // Daily price volatility
    const open = basePrice * (1 + (Math.random() - 0.5) / 50);
    const high = Math.max(open * (1 + Math.random() / 25), open);
    const low = Math.min(open * (1 - Math.random() / 25), open);
    const close = (open + high + low + basePrice) / 4; // Weighted towards base price
    
    // For demo consistency, make price and close the same
    const price = close;
    
    // Generate realistic volume
    const volume = Math.floor(getBaseVolume(symbol) * (0.5 + Math.random()));
    
    // Calculate some indicators
    let sma20 = null;
    let rsi = null;
    
    // Only calculate SMA after we have enough data points
    if (i <= days - 20) {
      const priceSlice = data.slice(data.length - 19).map(d => d.price);
      priceSlice.push(price);
      sma20 = priceSlice.reduce((sum, p) => sum + p, 0) / 20;
    }
    
    // Generate RSI (simplified random value between 30-70 with some trend following)
    if (data.length > 0) {
      const prevRSI = data[data.length - 1].rsi;
      if (prevRSI !== null) {
        // RSI tends to revert to mean (50) with some randomness
        rsi = prevRSI + (50 - prevRSI) * 0.1 + (Math.random() - 0.5) * 10;
        rsi = Math.min(Math.max(rsi, 10), 90); // Clamp between 10 and 90
      } else {
        rsi = 40 + Math.random() * 20; // Initial RSI between 40-60
      }
    } else {
      rsi = 40 + Math.random() * 20; // Initial RSI between 40-60
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      symbol,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      price: parseFloat(price.toFixed(2)),
      volume,
      sma20: sma20 !== null ? parseFloat(sma20.toFixed(2)) : null,
      rsi: rsi !== null ? parseFloat(rsi.toFixed(2)) : null
    });
  }
  
  return data;
}

/**
 * Get base price for a symbol
 * @private
 */
function getBasePrice(symbol) {
  const priceMap = {
    'AAPL': 180,
    'MSFT': 350,
    'GOOGL': 130,
    'AMZN': 120,
    'TSLA': 250,
    'META': 200,
    'NVDA': 450,
    'JPM': 140,
    'NFLX': 380,
    'DIS': 95,
    'BTCUSD': 28000,
    'ETHUSD': 1800,
    'XRPUSD': 0.5,
    'EURUSD': 1.1,
    'GBPUSD': 1.3,
    'USDJPY': 150,
    'DEMO': 100
  };
  
  return priceMap[symbol] || 100 + Math.random() * 100;
}

/**
 * Get base volume for a symbol
 * @private
 */
function getBaseVolume(symbol) {
  const volumeMap = {
    'AAPL': 80000000,
    'MSFT': 25000000,
    'GOOGL': 15000000,
    'AMZN': 30000000,
    'TSLA': 100000000,
    'META': 20000000,
    'NVDA': 40000000,
    'JPM': 10000000,
    'NFLX': 8000000,
    'DIS': 12000000,
    'BTCUSD': 25000,
    'ETHUSD': 15000,
    'XRPUSD': 5000000,
    'EURUSD': 120000,
    'GBPUSD': 80000,
    'USDJPY': 95000,
    'DEMO': 50000
  };
  
  return volumeMap[symbol] || 20000000;
}