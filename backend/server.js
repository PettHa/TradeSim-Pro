/**
 * Simple Express server for serving market data API
 */

import express from 'express';
import cors from 'cors';
import { fetchMarketData, fetchCompleteMarketData, fetchAvailableSymbols } from './alphavantage.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all endpoints
app.use(cors());

// Parse JSON request body
app.use(express.json());

// API endpoint for market data
app.get('/api/market-data', async (req, res) => {
  try {
    const { symbol = 'AAPL', timeframe = '1d', days = 100 } = req.query;
    
    console.log(`Market data request for ${symbol}, timeframe: ${timeframe}, days: ${days}`);
    
    const data = await fetchMarketData(symbol, timeframe, parseInt(days));
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for complete market data with indicators
app.get('/api/complete-market-data', async (req, res) => {
  try {
    const { symbol = 'AAPL', timeframe = '1d', days = 100 } = req.query;
    
    console.log(`Complete market data request for ${symbol}, timeframe: ${timeframe}, days: ${days}`);
    
    const data = await fetchCompleteMarketData(symbol, timeframe, parseInt(days));
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for available symbols
app.get('/api/symbols', async (req, res) => {
  try {
    const { keywords = '' } = req.query;
    
    console.log(`Symbols request with keywords: ${keywords}`);
    
    const data = await fetchAvailableSymbols(keywords);
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Market data API available at http://localhost:${PORT}/api/market-data`);
  console.log(`Health check endpoint available at http://localhost:${PORT}/api/health`);
});