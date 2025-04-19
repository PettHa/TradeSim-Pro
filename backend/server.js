/**
 * Enkel Express-server for å betjene markedsdata API
 */

import express from 'express';
import cors from 'cors';
import { fetchMarketData, fetchCompleteMarketData, fetchAvailableSymbols } from './alphavantage.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Aktiver CORS for alle endepunkter
app.use(cors());

// Parse JSON request body
app.use(express.json());

// API-endepunkt for markedsdata
app.get('/api/market-data', async (req, res) => {
  try {
    const { symbol = 'AAPL', timeframe = '1d', days = 100 } = req.query;
    
    const data = await fetchMarketData(symbol, timeframe, parseInt(days));
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API-endepunkt for komplett markedsdata med indikatorer
app.get('/api/complete-market-data', async (req, res) => {
  try {
    const { symbol = 'AAPL', timeframe = '1d', days = 100 } = req.query;
    
    const data = await fetchCompleteMarketData(symbol, timeframe, parseInt(days));
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API-endepunkt for tilgjengelige symboler
app.get('/api/symbols', async (req, res) => {
  try {
    const { keywords = '' } = req.query;
    
    const data = await fetchAvailableSymbols(keywords);
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
  console.log(`Markedsdata API tilgjengelig på http://localhost:${PORT}/api/market-data`);
});