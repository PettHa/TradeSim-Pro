/**
 * Market data service for frontend
 * Connects to backend API (which uses Python/yfinance)
 */

// Get API URL from environment variables (.env) or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
console.log("Frontend Service: Using API URL:", API_URL);

// --- API Availability Check ---
let apiAvailable = undefined; // Use undefined initially to distinguish between unchecked, available, and unavailable
let apiCheckPromise = null; // Hold promise for ongoing check

async function performApiCheck() {
  console.log("Frontend Service: Performing API availability check...");
  let checkUrl = `${API_URL}/health`;
  try {
    const response = await fetch(checkUrl, { method: 'GET', signal: AbortSignal.timeout(5000) }); // Add timeout
    apiAvailable = response.ok;
    if (apiAvailable) {
      console.log(`Frontend Service: Backend API is available at ${checkUrl} (Status: ${response.status})`);
    } else {
      const errorText = response.statusText || `Status ${response.status}`;
      console.error(`Frontend Service: Backend API check failed at ${checkUrl}. ${errorText}`);
      apiAvailable = false;
    }
  } catch (error) {
     if (error.name === 'AbortError') {
         console.error(`Frontend Service: Timeout connecting to Backend API health endpoint: ${checkUrl}`, error.message);
     } else {
        console.error(`Frontend Service: Error connecting to Backend API health endpoint: ${checkUrl}`, error.message);
     }
    apiAvailable = false;
  }
  return apiAvailable;
}

// Function to ensure API check is done only once but can be awaited multiple times
function checkApiAvailability() {
  if (apiCheckPromise === null) {
    apiCheckPromise = performApiCheck().finally(() => {
        // Reset promise after completion so next check can run if needed (e.g., after a retry)
        // Keep apiAvailable status.
        // apiCheckPromise = null; // Keep the promise result cached until explicitly retried
    });
  }
  return apiCheckPromise;
}

// Function to allow explicitly retrying the API check
export async function retryApiCheck() {
    console.log("Frontend Service: Retrying API availability check...");
    apiCheckPromise = null; // Reset promise to force a new check
    return await checkApiAvailability();
}


/** Helper function to handle API responses */
async function handleApiResponse(response, operationName = 'API request') {
    if (!response.ok) {
        let errorData = { message: `API request failed with status ${response.status}.` };
        try {
            // Try to parse JSON error, otherwise use status text
            const jsonError = await response.json();
            errorData = { ...errorData, ...jsonError }; // Merge messages if both exist
             if (!errorData.message && jsonError.error) { // Use 'error' field if message is missing
                errorData.message = jsonError.error;
             }
        } catch (e) {
             errorData.message = `${operationName} failed: ${response.status} ${response.statusText}`;
        }
         console.error(`Frontend Service: API Error (${response.status}) during ${operationName}:`, errorData);
        throw new Error(errorData.message || `API request failed: ${response.status}`);
    }
    // Check for empty response before parsing JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
    } else {
         console.warn(`Frontend Service: Received non-JSON response for ${operationName}`);
         // Return null or empty array/object based on expected type, or throw?
         return null; // Or handle as appropriate
    }
}


/** Helper function to check API and throw error if unavailable */
async function ensureApiAvailable() {
  const isAvailable = await checkApiAvailability(); // Wait for the check to complete
  if (!isAvailable) {
    console.error("Frontend Service: API is not available. Throwing error.");
    throw new Error('Market data API is not available. Please ensure the backend service is running and accessible.');
  }
   // console.log("Frontend Service: API confirmed available."); // Optional debug log
}

/**
 * Fetch market data from API.
 * NOTE: In the new backend, this returns the same complete data as fetchCompleteMarketData.
 * Kept for potential legacy compatibility or differentiation later.
 *
 * @param {string} symbol - Trading symbol (e.g., 'AAPL')
 * @param {string} timeframe - Timeframe ID ('1d', '1wk', '1mo' - must match backend)
 * @param {number} days - Number of days/periods of data to return
 * @returns {Promise<Array>} - Market data array or throws error
 */
export const fetchMarketData = async (symbol = 'AAPL', timeframe = '1d', days = 100) => {
  await ensureApiAvailable(); // Wait for check and throw if unavailable

  const url = `${API_URL}/market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&days=${days}`;
  console.log(`Frontend Service: Fetching legacy market data (using complete) from: ${url}`);

  try {
    const response = await fetch(url);
    const data = await handleApiResponse(response, `fetchMarketData for ${symbol}`);
    // Ensure data is an array
    if (!Array.isArray(data)) {
        console.error(`Frontend Service: Invalid data format received from /api/market-data. Expected array, got:`, data);
        throw new Error("Invalid data format received from server.");
    }
    return data;
  } catch (error) {
    console.error(`Frontend Service: Error in fetchMarketData for ${symbol}:`, error.message);
    throw error; // Re-throw the specific error
  }
};

/**
 * Fetch market data with technical indicators from API.
 *
 * @param {string} symbol - Trading symbol
 * @param {string} timeframe - Timeframe ID ('1h', '1d', '1wk', '1mo' - must match backend)
 * @param {number} days - Number of days/periods
 * @returns {Promise<Array>} - Complete market data array or throws error
 */
export const fetchCompleteMarketData = async (symbol = 'AAPL', timeframe = '1d', days = 100) => {
  await ensureApiAvailable(); // Wait for check and throw if unavailable

  const url = `${API_URL}/complete-market-data?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&days=${days}`;
   console.log(`Frontend Service: Fetching complete market data from: ${url}`);

  try {
    const response = await fetch(url);
    const data = await handleApiResponse(response, `fetchCompleteMarketData for ${symbol}`);
     // Ensure data is an array
     if (!Array.isArray(data)) {
        console.error(`Frontend Service: Invalid data format received from /api/complete-market-data. Expected array, got:`, data);
        throw new Error("Invalid data format received from server.");
     }
    return data;
  } catch (error) {
    console.error(`Frontend Service: Error in fetchCompleteMarketData for ${symbol}:`, error.message);
    throw error; // Re-throw error
  }
};

/**
 * Fetch available symbols/instruments from API.
 *
 * @param {string} keywords - Search terms (currently ignored by backend).
 * @returns {Promise<Array>} - List of trading instruments or throws error
 */
export const fetchAvailableSymbols = async (keywords = '') => {
  await ensureApiAvailable(); // Wait for check and throw if unavailable

  // Keywords parameter is kept for potential future use, but backend ignores it now
  const url = `${API_URL}/symbols?keywords=${encodeURIComponent(keywords)}`;
  console.log(`Frontend Service: Fetching available symbols from: ${url}`);

  try {
    const response = await fetch(url);
    const data = await handleApiResponse(response, 'fetchAvailableSymbols');
     // Ensure data is an array
     if (!Array.isArray(data)) {
        console.error(`Frontend Service: Invalid data format received from /api/symbols. Expected array, got:`, data);
        throw new Error("Invalid data format received from server.");
     }
    return data;
  } catch (error) {
    console.error('Frontend Service: Error in fetchAvailableSymbols:', error.message);
    throw error; // Re-throw error
  }
};

/**
 * Fetch list of available timeframes from the backend API.
 *
 * @returns {Promise<Array>} - Available timeframes array (e.g., [{id: '1d', name: '1 Day', yf_interval: '1d'}, ...]) or throws error
 */
export const fetchAvailableTimeframes = async () => {
  await ensureApiAvailable(); // Wait for check and throw if unavailable

  const url = `${API_URL}/timeframes`; // Call the new backend endpoint
  console.log(`Frontend Service: Fetching available timeframes from: ${url}`);

  try {
    const response = await fetch(url);
    const data = await handleApiResponse(response, 'fetchAvailableTimeframes');
    // Validate data format
    if (!Array.isArray(data) || (data.length > 0 && (!data[0].id || !data[0].name))) {
        console.error("Frontend Service: Invalid format received for timeframes, expected array of objects with 'id' and 'name'.", data);
        throw new Error("Invalid data format received for timeframes.");
    }
    console.log("Frontend Service: Received timeframes:", data);
    return data;
  } catch (error) {
    console.error('Frontend Service: Error in fetchAvailableTimeframes:', error.message);
    throw error; // Re-throw error
  }
};


// --- Initial API Check Trigger ---
// Start the check when the module loads, but allow functions to await its completion.
checkApiAvailability(); // Call it to initiate the check