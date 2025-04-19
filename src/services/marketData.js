/**
 * Markedsdata-tjeneste for frontend
 * Kobler til backend API eller bruker testdata
 */

import { generateSampleData, generateAvailableSymbols as generateFakeSymbols } from './dataGenerator';

// Hent API URL fra miljøvariabler (.env)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Sjekk om API er tilgjengelig
let apiAvailable = false;

// Test API-tilgjengelighet ved oppstart
(async function checkApiAvailability() {
  try {
    const response = await fetch(`${API_URL}/market-data?symbol=AAPL&days=1`);
    apiAvailable = response.ok;
    console.log('Markedsdata API er', apiAvailable ? 'tilgjengelig' : 'ikke tilgjengelig');
  } catch (error) {
    console.log('Markedsdata API er ikke tilgjengelig - bruker testdata');
    apiAvailable = false;
  }
})();

/**
 * Henter markedsdata fra API eller genererer testdata
 * 
 * @param {string} symbol - Handelssymbol (f.eks. 'AAPL')
 * @param {string} timeframe - Tidsramme ('1d', '1w', '1M')
 * @param {number} days - Antall dager av data som skal returneres
 * @returns {Promise<Array>} - Markedsdata
 */
export const fetchMarketData = async (symbol = 'AAPL', timeframe = '1d', days = 100) => {
  // Forsøk å bruke API hvis tilgjengelig
  if (apiAvailable) {
    try {
      const response = await fetch(`${API_URL}/market-data?symbol=${symbol}&timeframe=${timeframe}&days=${days}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Feil ved henting av markedsdata fra API:', error);
      console.log('Fallback til genererte testdata');
      // Fallback til testdata hvis API feiler
      return generateSampleData(days, symbol);
    }
  } else {
    // Bruk genererte testdata hvis API ikke er tilgjengelig
    console.log('Bruker genererte testdata for', symbol);
    return generateSampleData(days, symbol);
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
export const fetchCompleteMarketData = async (symbol = 'AAPL', timeframe = '1d', days = 100) => {
  // Forsøk å bruke API hvis tilgjengelig
  if (apiAvailable) {
    try {
      const response = await fetch(`${API_URL}/complete-market-data?symbol=${symbol}&timeframe=${timeframe}&days=${days}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Feil ved henting av komplett markedsdata fra API:', error);
      // Fallback til vanlig markedsdata
      return fetchMarketData(symbol, timeframe, days);
    }
  } else {
    // Bruk genererte testdata hvis API ikke er tilgjengelig
    return fetchMarketData(symbol, timeframe, days);
  }
};

/**
 * Hent tilgjengelige symboler/instrumenter
 * 
 * @param {string} keywords - Søkeord for å finne relevante symboler
 * @returns {Promise<Array>} - Liste over handelsinstrumenter
 */
export const fetchAvailableSymbols = async (keywords = '') => {
  // Forsøk å bruke API hvis tilgjengelig
  if (apiAvailable) {
    try {
      const response = await fetch(`${API_URL}/symbols?keywords=${keywords}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Feil ved henting av symboler fra API:', error);
      // Fallback til testdata
      return generateFakeSymbols();
    }
  } else {
    // Bruk genererte symboler hvis API ikke er tilgjengelig
    return generateFakeSymbols();
  }
};

/**
 * Generer liste over tilgjengelige tidsrammer
 * 
 * @returns {Array} - Tilgjengelige tidsrammer
 */
export const generateAvailableTimeframes = () => {
  return [
    { id: '1d', name: '1 Dag' },
    { id: '1w', name: '1 Uke' },
    { id: '1M', name: '1 Måned' },
    { id: '3M', name: '3 Måneder' },
    { id: '1Y', name: '1 År' },
    { id: 'ALL', name: 'All Tid' }
  ];
};