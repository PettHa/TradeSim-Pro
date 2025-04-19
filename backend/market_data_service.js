/**
 * Market data service using a Python script (yfinance) for fetching
 * and local CSV file caching.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process'; // <-- Importer spawn
// import dotenv from 'dotenv'; // Ikke lenger nødvendig for API-nøkkel

// --- Konfigurasjon ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sti til Python eksekverbar fil (juster om nødvendig)
// Forsøk å finne python3 eller python i PATH
const PYTHON_EXECUTABLE = process.platform === 'win32' ? 'python' : 'python3';

// Sti til Python-skriptet (antar at det ligger i samme mappe)
const PYTHON_SCRIPT_PATH = path.resolve(__dirname, 'market_data_yf.py');

// Mappe for data lagret av Python-skriptet (bør matche Python-skriptets DATA_DIR)
const DATA_DIR = path.join(__dirname, 'market_data');

// Standard antall dager for JS-funksjonen (Python har sin egen default)
const DEFAULT_JS_DAYS = 100;

// Tilgjengelige tidsrammer (bør matche Python AVAILABLE_TIMEFRAMES)
// Vi trenger mapping til yf_interval for å finne riktig cache-fil
const AVAILABLE_TIMEFRAMES_JS = [
    { id: '1d', name: '1 Day', yf_interval: '1d' },
    { id: '1wk', 'name': '1 Week', yf_interval: '1wk' },
    { id: '1mo', 'name': '1 Month', yf_interval: '1mo' },
];
// ---------------------

// Hjelpefunksjon for å kjøre Python-skriptet
function runPythonScript(args = []) {
  return new Promise((resolve, reject) => {
    console.log(`JS: Spawning Python: ${PYTHON_EXECUTABLE} ${PYTHON_SCRIPT_PATH} ${args.join(' ')}`);
    const pyProcess = spawn(PYTHON_EXECUTABLE, [PYTHON_SCRIPT_PATH, ...args]);

    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(`PY_STDOUT: ${output.trim()}`); // Log Python output
    });

    pyProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      stderr += errorOutput;
      console.error(`PY_STDERR: ${errorOutput.trim()}`); // Log Python errors
    });

    pyProcess.on('close', (code) => {
      console.log(`JS: Python process exited with code ${code}`);
      if (code === 0) {
        resolve(stdout); // Resolve hvis suksess
      } else {
        reject(new Error(`Python script failed with code ${code}.\nStderr:\n${stderr}`)); // Reject ved feil
      }
    });

    pyProcess.on('error', (err) => {
        console.error('JS: Failed to start Python process.', err);
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}

// Hjelpefunksjon for å finne yf_interval (ligner Python-versjonen)
function mapTimeframeIdToYfInterval(timeframeId) {
    const tf = AVAILABLE_TIMEFRAMES_JS.find(t => t.id === timeframeId);
    return tf ? tf.yf_interval : '1d'; // Default til '1d'
}

// Hjelpefunksjon for å lage filnavn som matcher Python
function getCacheFilePath(symbol, timeframeId) {
    const yfInterval = mapTimeframeIdToYfInterval(timeframeId);
    // Erstatt ugyldige tegn for filnavn, spesielt '/' i forex-symboler
    const safeSymbol = symbol.replace(/[^a-zA-Z0-9\-.]/g, '-');
    return path.join(DATA_DIR, `${safeSymbol}_${yfInterval}_data.csv`);
}

/**
 * Ensures market data is fetched/updated by the Python script
 * and then loads the data from the CSV cache.
 *
 * @param {string} symbol - Trading symbol (Yahoo Finance format, e.g., 'AAPL', 'BTC-USD')
 * @param {string} timeframeId - Timeframe ID ('1d', '1wk', '1mo')
 * @param {number} days - Number of days of history requested (influences Python fetch *and* JS load limit)
 * @returns {Promise<Array>} - Market data array of objects
 * @throws {Error} - If Python script fails or CSV cannot be read
 */
export const fetchCompleteMarketData = async (symbol = 'AAPL', timeframeId = '1d', days = DEFAULT_JS_DAYS) => {
  // 1. Kjør Python-skriptet for å sikre at data/cache er oppdatert
  const pythonArgs = [
    '--symbol', symbol,
    '--timeframe', timeframeId,
    '--days', String(days) // Send days til Python også
  ];

  try {
    await runPythonScript(pythonArgs);
    // Python-skriptet har fullført (enten hentet nytt eller bekreftet fersk cache)
    console.log(`JS: Python script finished successfully for ${symbol}.`);

    // 2. Finn den forventede CSV-filstien
    const cacheFilePath = getCacheFilePath(symbol, timeframeId);
    console.log(`JS: Attempting to load data from: ${cacheFilePath}`);

    // 3. Les dataen fra CSV-filen som Python har laget/oppdatert
    if (fs.existsSync(cacheFilePath)) {
      // Bruk loadDataFromCSV til å lese filen
      // Pass 'days' for å begrense antall rader som returneres fra CSV
      const data = loadDataFromCSV(cacheFilePath, days);
      return data;
    } else {
      // Dette bør *egentlig* ikke skje hvis Python kjørte vellykket og fant/lagde data
      console.error(`JS: Error - Cache file not found after Python script execution: ${cacheFilePath}`);
      throw new Error(`Data file for ${symbol} not found after update attempt.`);
    }
  } catch (error) {
    console.error(`JS: Error fetching complete market data for ${symbol}:`, error.message);
    // Du kan velge å prøve å lese en *gammel* cache-fil her som en fallback,
    // men det kan være forvirrende siden Python-kallet feilet.
    const cacheFilePath = getCacheFilePath(symbol, timeframeId);
     if (fs.existsSync(cacheFilePath)) {
        console.warn(`JS: Python script failed, attempting to return potentially stale data from ${cacheFilePath}`);
        try {
            return loadDataFromCSV(cacheFilePath, days);
        } catch (loadError) {
            console.error(`JS: Failed to load stale cache file ${cacheFilePath}:`, loadError);
            throw new Error(`Python script failed and unable to load cache for ${symbol}. Original error: ${error.message}`);
        }
     } else {
        throw new Error(`Python script failed and no cache exists for ${symbol}. Original error: ${error.message}`);
     }
  }
};

/**
 * Fetches the list of available symbols by reading the CSV generated by Python.
 *
 * @returns {Promise<Array>} - List of symbol objects
 */
export const fetchAvailableSymbols = async () => {
  const symbolsFilePath = path.join(DATA_DIR, 'default_symbols.csv');

  // Kjør Python for å sikre at filen er opprettet hvis den mangler
  try {
      await runPythonScript(['--init-lists']);
  } catch(error) {
      console.warn(`JS: Python script failed during init-lists, file might be missing: ${error.message}`)
      // Fortsett uansett, loadDataFromCSV vil håndtere manglende fil
  }


  try {
    if (!fs.existsSync(symbolsFilePath)) {
        console.warn("JS: Default symbols file not found:", symbolsFilePath);
        return []; // Returner tom liste hvis filen ikke finnes
    }
    return loadDataFromCSV(symbolsFilePath); // Les filen
  } catch (error) {
    console.error(`JS: Error loading default symbols from ${symbolsFilePath}:`, error);
    return []; // Returner tom liste ved feil
  }
};

/**
 * Fetches the list of available timeframes by reading the CSV generated by Python.
 *
 * @returns {Promise<Array>} - List of timeframe objects
 */
export const fetchAvailableTimeframes = async () => {
    const timeframesFilePath = path.join(DATA_DIR, 'timeframes.csv');

    // Kjør Python for å sikre at filen er opprettet hvis den mangler
    try {
        await runPythonScript(['--init-lists']);
    } catch(error) {
        console.warn(`JS: Python script failed during init-lists, file might be missing: ${error.message}`)
    }


    try {
        if (!fs.existsSync(timeframesFilePath)) {
            console.warn("JS: Timeframes file not found:", timeframesFilePath);
            return [];
        }
        return loadDataFromCSV(timeframesFilePath); // Les filen
    } catch (error) {
        console.error(`JS: Error loading timeframes from ${timeframesFilePath}:`, error);
        return [];
    }
};


// --- Eksisterende CSV Hjelpefunksjoner (Uendret) ---

/**
 * Load data from CSV file
 *
 * @param {string} filePath - Path to the CSV file
 * @param {number|null} limit - Maximum number of *most recent* rows to return (optional). Null returns all.
 * @returns {Array} - Parsed data
 */
function loadDataFromCSV(filePath, limit = null) {
  try {
    if (!fs.existsSync(filePath)) {
         console.warn(`JS: CSV file not found: ${filePath}`); // Logg hvis filen ikke finnes
         return [];
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.trim().split('\n');

    if (lines.length < 2) {
      console.warn(`JS: CSV file is empty or has only headers: ${filePath}`);
      return [];
    }

    const headerLine = lines[0].trim();
    const header = headerLine.split(',');
    const hasDateColumn = header.includes('date');

    const allData = [];
    for (let i = 1; i < lines.length; i++) { // Start fra rad 1 (etter header)
        if (!lines[i] || lines[i].trim() === '') continue; // Hopp over tomme linjer

        const values = parseCSVLine(lines[i]);
        if (values.length !== header.length) {
             console.warn(`JS: Skipping row ${i+1} in ${filePath} due to incorrect number of columns. Expected ${header.length}, got ${values.length}. Line: "${lines[i]}"`);
             continue;
        }

        const item = {};
        // --- START KORRIGERING ---
        for (let j = 0; j < header.length; j++) {
             // Definer cleanedValue på nytt for hver kolonne (j)
             const rawValue = values[j] !== undefined ? String(values[j]).trim() : ''; // Håndter undefined og konverter til string
             let cleanedValue = rawValue;
             // Fjern doble anførselstegn rundt verdien hvis de finnes
             if (cleanedValue.startsWith('"') && cleanedValue.endsWith('"')) {
                 cleanedValue = cleanedValue.slice(1, -1).replace(/""/g, '"'); // Håndter også doble anførselstegn inne i feltet
             }

             const columnName = header[j]; // Bruk kolonnenavnet for klarhet

             // Nå kan vi trygt bruke cleanedValue
             if (cleanedValue === '' || cleanedValue === 'NaN' || cleanedValue === 'None' || cleanedValue === 'null') {
                 item[columnName] = null;
             } else if (!isNaN(cleanedValue) && cleanedValue !== '') { // Sjekk om den er et tall *og* ikke tom streng
                 // Konverter til Number hvis det er trygt (ikke date-kolonnen)
                 if (columnName !== 'date' && !isNaN(Number(cleanedValue))) {
                     item[columnName] = Number(cleanedValue);
                 } else {
                     // Behold som string hvis det er 'date' eller hvis Number() feiler (selv om isNaN var false)
                     item[columnName] = cleanedValue;
                 }
             } else {
                 // Behold som string hvis det ikke er et tall
                 item[columnName] = cleanedValue;
             }
        }
        // --- SLUTT KORRIGERING ---

        // Betinget datosjekk (som før, men nå bør item.date være korrekt parset som string)
        if (hasDateColumn && (item.date === null || item.date === undefined || item.date === '')) {
            console.warn(`JS: Row ${i+1} skipped in ${filePath} due to missing or invalid date value: "${item.date}"`);
            continue;
        }

        allData.push(item);
    }

    console.log(`JS: Loaded ${allData.length} data rows from ${filePath}`);

    // Returner de siste 'limit' radene hvis limit er satt
    if (limit !== null && limit > 0 && allData.length > limit) {
      return allData.slice(-limit);
    } else {
      return allData;
    }

  } catch (error) {
    console.error(`JS: Error reading CSV ${filePath}:`, error);
    return []; // Returner tom array ved feil
  }
}

/**
 * Helper for handling quoted values in CSV
 * (Uendret fra din originale kode)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
       // Håndter doble anførselstegn inne i et felt ("") som ett anførselstegn
       if (inQuotes && line[i+1] === '"') {
           current += '"';
           i++; // Hopp over neste anførselstegn
       } else {
           inQuotes = !inQuotes;
       }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current); // Legg til siste felt
  return result;
}

// Funksjoner som ikke lenger trengs direkte av JS for henting:
// - fetchMarketData (erstattet av fetchCompleteMarketData)
// - fetchSMA (håndteres av Python)
// - fetchRSI (håndteres av Python)
// - mapTimeframeToAV (Alpha Vantage spesifikk)
// - getTimeSeriesLabel (Alpha Vantage spesifikk)
// - getSymbolType (Kan hentes fra symbols.csv nå)
// - getDefaultSymbols (Hentes fra symbols.csv nå)
// - saveDataToCSV (Python lagrer nå)