/**
 * Markedsdata-tjeneste som bruker Alpha Vantage API
 * og lagrer data som CSV-filer
 * 
 * MERK: Du må registrere deg på https://www.alphavantage.co/ for å få en API-nøkkel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Last .env-filen fra root (to mapper opp)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });

// Hent API-nøkkel fra .env-filen
const API_KEY = process.env['ALPHAVANTAGE_KEY'];
if (!API_KEY) {
  console.error('ADVARSEL: Fant ikke ALPHAVANTAGE_KEY i .env-filen');
}

const BASE_URL = 'https://www.alphavantage.co/query';

// Definere mappe for datalagring
const DATA_DIR = path.join(__dirname, 'market_data');

// Opprett datamappen hvis den ikke eksisterer
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Opprettet datamappe: ${DATA_DIR}`);
}

/**
 * Henter markedsdata fra API og lagrer som CSV
 * 
 * @param {string} symbol - Handelssymbol (f.eks. 'AAPL')
 * @param {string} timeframe - Tidsramme ('daily', 'weekly', 'monthly')
 * @param {number} days - Antall dager av data som skal returneres
 * @returns {Promise<Array>} - Markedsdata
 */
export const fetchMarketData = async (symbol = 'AAPL', timeframe = 'daily', days = 100) => {
  const cacheFilePath = path.join(DATA_DIR, `${symbol}_${timeframe}.csv`);
  
  // Sjekk om vi har lagret data og om den er mindre enn 24 timer gammel
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
    
    // Fetch data
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for error messages from Alpha Vantage
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    // Process the data
    const timeSeries = data[`Time Series (${getTimeSeriesLabel(avTimeframe)})`];
    
    if (!timeSeries) {
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
    
    // Lagre dataene som CSV
    saveDataToCSV(cacheFilePath, formattedData);
    
    // Returner bare antall dager som er forespurt
    return formattedData.slice(0, days).reverse(); // Reverse for kronologisk rekkefølge
  } catch (error) {
    console.error('Error fetching market data:', error);
    
    // Prøv å lese fra lagret data hvis API-kallet feiler
    if (fs.existsSync(cacheFilePath)) {
      console.log(`Bruker tidligere lagret data for ${symbol}`);
      return loadDataFromCSV(cacheFilePath, days);
    }
    
    throw error; // Videresend feilen hvis vi ikke har noe lagret data
  }
};

/**
 * Hent tekniske indikatorer (SMA)
 * 
 * @param {string} symbol - Handelssymbol
 * @returns {Promise<Array>} - SMA data
 */
export const fetchSMA = async (symbol = 'AAPL') => {
  const cacheFilePath = path.join(DATA_DIR, `${symbol}_sma20.csv`);
  
  // Sjekk om vi har lagret data og om den er mindre enn 24 timer gammel
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
      throw new Error('Unexpected API response format for SMA');
    }
    
    const smaData = [];
    
    for (const date in technicalData) {
      smaData.push({
        date: date,
        sma20: parseFloat(technicalData[date]['SMA'])
      });
    }
    
    // Lagre dataene som CSV
    saveDataToCSV(cacheFilePath, smaData);
    
    return smaData;
  } catch (error) {
    console.error('Error fetching SMA data:', error);
    
    // Prøv å lese fra lagret data hvis API-kallet feiler
    if (fs.existsSync(cacheFilePath)) {
      console.log(`Bruker tidligere lagret SMA-data for ${symbol}`);
      return loadDataFromCSV(cacheFilePath);
    }
    
    throw error;
  }
};

/**
 * Hent tekniske indikatorer (RSI)
 * 
 * @param {string} symbol - Handelssymbol
 * @returns {Promise<Array>} - RSI data
 */
export const fetchRSI = async (symbol = 'AAPL') => {
  const cacheFilePath = path.join(DATA_DIR, `${symbol}_rsi.csv`);
  
  // Sjekk om vi har lagret data og om den er mindre enn 24 timer gammel
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
      throw new Error('Unexpected API response format for RSI');
    }
    
    const rsiData = [];
    
    for (const date in technicalData) {
      rsiData.push({
        date: date,
        rsi: parseFloat(technicalData[date]['RSI'])
      });
    }
    
    // Lagre dataene som CSV
    saveDataToCSV(cacheFilePath, rsiData);
    
    return rsiData;
  } catch (error) {
    console.error('Error fetching RSI data:', error);
    
    // Prøv å lese fra lagret data hvis API-kallet feiler
    if (fs.existsSync(cacheFilePath)) {
      console.log(`Bruker tidligere lagret RSI-data for ${symbol}`);
      return loadDataFromCSV(cacheFilePath);
    }
    
    throw error;
  }
};

/**
 * Hent markedsdata med tekniske indikatorer
 * 
 * @param {string} symbol - Handelssymbol
 * @param {string} timeframe - Tidsramme
 * @param {number} days - Antall dager
 * @returns {Promise<Array>} - Komplett markedsdata
 */
export const fetchCompleteMarketData = async (symbol = 'AAPL', timeframe = 'daily', days = 100) => {
  try {
    // Fetch base market data
    const marketData = await fetchMarketData(symbol, timeframe, days);
    
    // Fetch technical indicators
    const smaData = await fetchSMA(symbol);
    const rsiData = await fetchRSI(symbol);
    
    // Create a map for easier lookups
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
    
    // Lagre den kombinerte dataen
    const combinedFilePath = path.join(DATA_DIR, `${symbol}_${timeframe}_complete.csv`);
    saveDataToCSV(combinedFilePath, completeData);
    
    return completeData;
  } catch (error) {
    console.error('Error fetching complete market data:', error);
    throw error;
  }
};

/**
 * Hent tilgjengelige symboler/instrumenter
 * 
 * @param {string} keywords - Søkeord for å finne relevante symboler
 * @returns {Promise<Array>} - Liste over handelsinstrumenter
 */
export const fetchAvailableSymbols = async (keywords = '') => {
  const cacheFilePath = path.join(DATA_DIR, `symbols_${keywords.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  
  if (fs.existsSync(cacheFilePath)) {
    const stats = fs.statSync(cacheFilePath);
    const fileAge = Date.now() - stats.mtimeMs;
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // Symboler endrer seg ikke så ofte
    
    if (fileAge < ONE_WEEK) {
      return loadDataFromCSV(cacheFilePath);
    }
  }
  
  try {
    if (!keywords) {
      // Hvis ingen søkeord, bruk standard symboler
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
    
    // Process symbols data
    const matches = data.bestMatches || [];
    
    const symbols = matches.map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: getSymbolType(match['3. type']),
      region: match['4. region'],
      currency: match['8. currency']
    }));
    
    // Lagre symbolene
    saveDataToCSV(cacheFilePath, symbols);
    
    return symbols;
  } catch (error) {
    console.error('Error fetching available symbols:', error);
    
    // Prøv å lese fra lagret data hvis API-kallet feiler
    if (fs.existsSync(cacheFilePath)) {
      console.log(`Bruker tidligere lagrede symboler for søk: ${keywords}`);
      return loadDataFromCSV(cacheFilePath);
    }
    
    // Returner standard symboler som en siste utvei
    const defaultSymbols = getDefaultSymbols();
    return defaultSymbols;
  }
};

/**
 * Generer liste over tilgjengelige tidsrammer
 * 
 * @returns {Array} - Tilgjengelige tidsrammer
 */
export const generateAvailableTimeframes = () => {
  const timeframes = [
    { id: '1d', name: '1 Dag' },
    { id: '1w', name: '1 Uke' },
    { id: '1M', name: '1 Måned' },
  ];
  
  // Lagre som CSV for konsistens
  saveDataToCSV(path.join(DATA_DIR, 'timeframes.csv'), timeframes);
  
  return timeframes;
};

// Hjelpefunksjoner

/**
 * Mapper applikasjonens tidsramme-ID til Alpha Vantage funksjon
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
 * Henter riktig label for tidsserie basert på funksjonen
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
 * Mapper Alpha Vantage symboltypemapping til applikasjonens format
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
 * Standardliste med symboler
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
 * Lagrer data som CSV-fil
 * 
 * @param {string} filePath - Sti til filen
 * @param {Array} data - Data som skal lagres
 */
function saveDataToCSV(filePath, data) {
  if (!data || data.length === 0) {
    console.warn('Ingen data å lagre til', filePath);
    return;
  }
  
  try {
    // Hent feltene fra første dataobjekt
    const fields = Object.keys(data[0]);
    
    // Lag CSV header
    const header = fields.join(',');
    
    // Konverter hver datarække til CSV
    const rows = data.map(item => {
      return fields.map(field => {
        const value = item[field];
        
        // Håndter spesialtilfeller
        if (value === null || value === undefined) {
          return '';
        }
        
        // Håndter strenger med komma
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        
        return value;
      }).join(',');
    });
    
    // Kombiner header og rader
    const csvContent = [header, ...rows].join('\n');
    
    // Skriv til fil
    fs.writeFileSync(filePath, csvContent, 'utf8');
    console.log(`Data lagret til ${filePath}`);
  } catch (error) {
    console.error('Feil ved lagring av CSV:', error);
  }
}

/**
 * Laster data fra CSV-fil
 * 
 * @param {string} filePath - Sti til CSV-filen
 * @param {number} limit - Maksimalt antall rader å returnere (valgfritt)
 * @returns {Array} - Parsed data
 */
function loadDataFromCSV(filePath, limit = null) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    if (lines.length < 2) {
      console.warn('CSV-fil er tom eller har bare overskrifter:', filePath);
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
    
    console.log(`Lastet ${data.length} datarader fra ${filePath}`);
    return data;
  } catch (error) {
    console.error('Feil ved lesing av CSV:', error);
    return [];
  }
}

/**
 * Hjelper for å håndtere siterte verdier i CSV
 * 
 * @param {string} line - En linje fra CSV-filen
 * @returns {Array} - Parsed verdier
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