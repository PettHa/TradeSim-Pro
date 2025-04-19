/**
 * Simple Express server for serving market data API
 * using the Python-based yfinance data service.
 */

import express from 'express';
import cors from 'cors';
// V V V V V ENDRE DENNE IMPORTEN V V V V V
import {
  fetchCompleteMarketData, // Hovedfunksjonen for data med indikatorer
  fetchAvailableSymbols,   // Funksjon for å hente symbolliste
  fetchAvailableTimeframes // Ny funksjon for å hente tidsrammer
} from './market_data_service.js'; // <-- Endre filnavnet her til navnet på den nye JS-filen

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all endpoints
app.use(cors());

// Parse JSON request body
app.use(express.json());

// API endpoint for market data (bruker nå fetchCompleteMarketData)
// MERK: Siden Python-scriptet alltid beregner indikatorer,
// gir denne nå samme resultat som /api/complete-market-data.
app.get('/api/market-data', async (req, res) => {
  try {
    // Bruk standardverdier som matcher den nye tjenesten hvis nødvendig
    const { symbol = 'AAPL', timeframe = '1d', days = 100 } = req.query;

    // Valider/konverter 'days' til et tall
    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays <= 0) {
      return res.status(400).json({ error: "Invalid 'days' parameter. Must be a positive integer." });
    }

    console.log(`Legacy market data request (now using fetchCompleteMarketData) for ${symbol}, timeframe: ${timeframe}, days: ${numDays}`);

    // Kall den nye funksjonen
    const data = await fetchCompleteMarketData(symbol, timeframe, numDays);
    res.json(data);
  } catch (error) {
    console.error('API Error (/api/market-data):', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch market data' });
  }
});

// API endpoint for complete market data with indicators
app.get('/api/complete-market-data', async (req, res) => {
  try {
    const { symbol = 'AAPL', timeframe = '1d', days = 100 } = req.query;

    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays <= 0) {
      return res.status(400).json({ error: "Invalid 'days' parameter. Must be a positive integer." });
    }

    console.log(`Complete market data request for ${symbol}, timeframe: ${timeframe}, days: ${numDays}`);

    // Kall den nye funksjonen (som importeres fra market_data_service.js)
    const data = await fetchCompleteMarketData(symbol, timeframe, numDays);
    res.json(data);
  } catch (error) {
    console.error('API Error (/api/complete-market-data):', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch complete market data' });
  }
});

// API endpoint for available symbols
app.get('/api/symbols', async (req, res) => {
  try {
    // Merk: 'keywords' støttes ikke lenger av backend (yfinance), men vi lar den være i API-et
    const { keywords = '' } = req.query;

    console.log(`Symbols request (keywords ignored by yfinance backend): ${keywords}`);

    // Kall den nye funksjonen
    const data = await fetchAvailableSymbols(); // Keywords trengs ikke lenger her
    res.json(data);
  } catch (error) {
    console.error('API Error (/api/symbols):', error.message);
    res.status(500).json({ error: error.message || 'Failed to fetch available symbols' });
  }
});

// --- NYTT ENDPOINT ---
// API endpoint for available timeframes
app.get('/api/timeframes', async (req, res) => {
    try {
      console.log(`Timeframes request`);
      // Kall den nye funksjonen
      const data = await fetchAvailableTimeframes();
      res.json(data);
    } catch (error) {
      console.error('API Error (/api/timeframes):', error.message);
      res.status(500).json({ error: error.message || 'Failed to fetch available timeframes' });
    }
  });


// Health check endpoint (uendret)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Endpoints:`);
  console.log(`  Market Data (Complete): http://localhost:${PORT}/api/complete-market-data?symbol=AAPL&timeframe=1d&days=50`);
  console.log(`  Legacy Market Data:    http://localhost:${PORT}/api/market-data?symbol=MSFT&timeframe=1wk&days=20`);
  console.log(`  Available Symbols:     http://localhost:${PORT}/api/symbols`);
  console.log(`  Available Timeframes:  http://localhost:${PORT}/api/timeframes`);
  console.log(`  Health Check:          http://localhost:${PORT}/api/health`);
});