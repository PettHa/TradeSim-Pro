// --- Fil: src/App.js ---

import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // Hoved-CSS for layout
import './index.css'; // Globale stiler og CSS-variabler

import Header from './layout/Header/Header';
import Footer from './layout/Footer/Footer';
import StrategyConfig from './components/strategy/StrategyConfig/StrategyConfig';
import PriceChart from './components/chart/PriceChart/PriceChart';
import BacktestResults from './components/results/BacktestResults/BacktestResults';
import TradeHistory from './components/results/TradeHistory/TradeHistory';
import ApiStatus from './components/common/ApiStatus/ApiStatus';
import Button from './components/common/Button/Button'; // Felles knappekomponent

import { fetchCompleteMarketData, fetchAvailableTimeframes, fetchAvailableSymbols, retryApiCheck } from './services/marketData';
import { runBacktest } from './services/backtester';
import { DEFAULT_STRATEGY } from './constants'; // Importer standardstrategi
import Panel from './components/common/Panel/Panel';

function App() {
  // --- State Hooks ---
  const [marketData, setMarketData] = useState([]);
  const [strategy, setStrategy] = useState(() => {
      // Lazy initialization: Last inn fra localStorage hvis mulig, ellers bruk default
      try {
          const savedStrategy = localStorage.getItem('tradeSimProStrategy');
          return savedStrategy ? JSON.parse(savedStrategy) : DEFAULT_STRATEGY;
      } catch (e) {
          console.error("Error loading strategy from localStorage", e);
          return DEFAULT_STRATEGY;
      }
  });
  const [results, setResults] = useState(null);
  const [isBacktestLoading, setIsBacktestLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL'); // Startsymbol
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d'); // Start-tidsramme ID
  const [availableTimeframes, setAvailableTimeframes] = useState([]); // Liste over tidsrammer fra API
  const [isLoadingData, setIsLoadingData] = useState(true); // Laster markedsdata?
  const [isLoadingTimeframes, setIsLoadingTimeframes] = useState(true); // Laster tidsrammer?
  const [apiError, setApiError] = useState(''); // API-feilmelding

  // --- Effekt for å lagre strategi i localStorage ---
  useEffect(() => {
      try {
          localStorage.setItem('tradeSimProStrategy', JSON.stringify(strategy));
          console.log("[App.js Effect] Strategy saved to localStorage.");
      } catch (e) {
          console.error("Error saving strategy to localStorage", e);
      }
  }, [strategy]); // Kjør hver gang strategy endres

  // --- Data Loading Logic ---
  const loadInitialData = useCallback(async (symbol, timeframe) => {
    setIsLoadingTimeframes(true);
    setIsLoadingData(true);
    setApiError('');
    console.log(`[App.js loadInitialData] Loading for ${symbol}, Timeframe: ${timeframe}`);

    let timeframesLoaded = false;
    let marketDataLoaded = false;
    let finalTimeframe = timeframe; // Hold styr på tidsrammen som skal brukes

    try {
      // 1. Hent tidsrammer
      const timeframes = await fetchAvailableTimeframes();
      setAvailableTimeframes(timeframes);
      console.log("[App.js loadInitialData] Fetched timeframes:", timeframes);
      // Sjekk om valgt tidsramme er gyldig, ellers velg første
      if (timeframes.length > 0 && !timeframes.find(tf => tf.id === timeframe)) {
          finalTimeframe = timeframes[0].id;
          console.warn(`[App.js loadInitialData] Timeframe '${timeframe}' not available. Falling back to '${finalTimeframe}'.`);
          setSelectedTimeframe(finalTimeframe); // Oppdater state
      } else if (timeframes.length === 0) {
          console.warn("[App.js loadInitialData] No timeframes returned from API. Using default '1d'.");
          finalTimeframe = '1d'; // Fallback hvis ingen tidsrammer lastes
          setSelectedTimeframe(finalTimeframe);
      }
      timeframesLoaded = true;
    } catch (error) {
        console.error('[App.js loadInitialData] Error loading available timeframes:', error);
        setApiError(`Failed to load timeframes: ${error.message}.`);
        // Ikke stopp, prøv å laste markedsdata med antatt tidsramme
    } finally {
        setIsLoadingTimeframes(false);
    }

    try {
        // 2. Hent markedsdata (bruk finalTimeframe)
        console.log(`[App.js loadInitialData] Fetching market data with timeframe: ${finalTimeframe}`);
        const data = await fetchCompleteMarketData(symbol, finalTimeframe, 500); // Hent litt mer data (f.eks. 500 punkter)
        console.log(`[App.js loadInitialData] Loaded ${data?.length || 0} market data points for ${symbol} (${finalTimeframe})`);
        setMarketData(data || []); // Sørg for at det alltid er et array
        marketDataLoaded = true;
    } catch (error) {
        console.error(`[App.js loadInitialData] Error loading market data for ${symbol} (${finalTimeframe}):`, error);
        if (!apiError) { // Ikke overskriv tidligere feilmelding om tidsrammer
             setApiError(`Failed to load market data for ${symbol}: ${error.message}.`);
        }
        setMarketData([]);
    } finally {
        setIsLoadingData(false);
    }
  }, []); // Empty dependency array for initial load logic definition

  // Initial lasting ved mount
  useEffect(() => {
    console.log("[App.js Mount Effect] Triggering initial data load.");
    loadInitialData(selectedSymbol, selectedTimeframe);
  }, [loadInitialData]); // Dependency on the memoized function itself

   // Last markedsdata på nytt når symbol eller tidsramme endres (etter initiell lasting)
   useEffect(() => {
       // Kjør KUN hvis:
       // 1. Ikke under initiell lasting (isLoadingTimeframes er false)
       // 2. Ikke under lasting av data generelt (isLoadingData er false)
       // 3. Symbol eller Timeframe har endret seg (implisitt via dependency array)
       if (!isLoadingTimeframes && !isLoadingData) {
            console.log(`[App.js Symbol/Timeframe Effect] Reloading market data for ${selectedSymbol} (${selectedTimeframe}).`);
            setIsLoadingData(true); // Sett loading før kall
            setApiError(''); // Nullstill feil
            fetchCompleteMarketData(selectedSymbol, selectedTimeframe, 500) // Hent data for nytt valg
               .then(data => {
                   console.log(`[App.js Symbol/Timeframe Effect] Reloaded ${data?.length || 0} data points.`);
                   setMarketData(data || []);
               })
               .catch(error => {
                   console.error(`[App.js Symbol/Timeframe Effect] Error reloading market data:`, error);
                   setApiError(`Failed to load market data for ${selectedSymbol}: ${error.message}.`);
                   setMarketData([]);
               })
               .finally(() => {
                   setIsLoadingData(false); // Fjern loading etter kall
               });
       }
   }, [selectedSymbol, selectedTimeframe, isLoadingTimeframes]); // Rerun when symbol/timeframe changes *after* timeframes are loaded


  // --- API Retry ---
  const handleRetryConnection = async () => {
    console.log("[App.js] Retrying API connection...");
    setApiError('');
    setIsLoadingTimeframes(true); // Indikerer at vi prøver å laste på nytt
    setIsLoadingData(true);
    await retryApiCheck(); // Force re-check in service
    loadInitialData(selectedSymbol, selectedTimeframe); // Prøv å laste alt på nytt
  };

  // --- Backtest Execution ---
  const handleRunBacktest = async () => {
    if (!marketData || marketData.length === 0) {
      setApiError('Cannot run backtest: No market data available.');
      console.warn("[App.js handleRunBacktest] Aborted: No market data.");
      return;
    }
    if (!strategy) {
         setApiError('Cannot run backtest: Strategy configuration is missing.');
         console.warn("[App.js handleRunBacktest] Aborted: Strategy missing.");
         return;
    }

    console.log("[App.js handleRunBacktest] Starting backtest...");
    setIsBacktestLoading(true);
    setResults(null); // Nullstill gamle resultater
    setApiError('');
    try {
      // Pass a copy of market data and strategy to avoid potential mutation issues?
      // const strategyCopy = JSON.parse(JSON.stringify(strategy));
      // const marketDataCopy = JSON.parse(JSON.stringify(marketData));
      // await runBacktest(strategyCopy, marketDataCopy); -> Kan være tregt for store data

      // Prøv uten kopiering først
      const backtestResults = await runBacktest(strategy, marketData);
      console.log("[App.js handleRunBacktest] Backtest completed, results:", backtestResults);
      setResults(backtestResults);
    } catch (error) {
      console.error('[App.js handleRunBacktest] Backtest error:', error);
      setApiError(`Backtest simulation failed: ${error.message}`);
      setResults(null);
    } finally {
      setIsBacktestLoading(false);
      console.log("[App.js handleRunBacktest] Backtest loading finished.");
    }
  };

  // --- Strategy and UI Handlers ---

  // *** DENNE ER VIKTIG ***
  const handleStrategyChange = useCallback((changedData) => {
      console.log("[App.js handleStrategyChange] Received changes:", changedData);
      setStrategy(prevStrategy => {
          // Lag et helt NYTT objekt for å garantere re-render
          const newStrategy = {
            ...prevStrategy,
            ...changedData
          };
          console.log("[App.js handleStrategyChange] Updating state. Old:", prevStrategy);
          console.log("[App.js handleStrategyChange] New state:", newStrategy);
          return newStrategy;
      });
      setResults(null); // Nullstill resultater når strategien endres
  }, []); // useCallback for å sikre at funksjonen ikke lages på nytt unødvendig

  const handleSymbolChange = useCallback((symbol) => {
    console.log(`[App.js handleSymbolChange] Symbol changed to: ${symbol}`);
    setSelectedSymbol(symbol);
    setResults(null); // Nullstill resultater
    setMarketData([]); // Tøm gamle data mens nye lastes
    // useEffect for symbol/timeframe vil trigge datalasting
  }, []);

  const handleTimeframeChange = useCallback((timeframeId) => {
    console.log(`[App.js handleTimeframeChange] Timeframe changed to: ${timeframeId}`);
    setSelectedTimeframe(timeframeId);
    setResults(null); // Nullstill resultater
    setMarketData([]); // Tøm gamle data mens nye lastes
     // useEffect for symbol/timeframe vil trigge datalasting
  }, []);

  const handleResetStrategy = useCallback(() => {
    console.log("[App.js handleResetStrategy] Resetting strategy to default.");
    if (window.confirm("Are you sure you want to reset the strategy to its default settings?")) {
         setStrategy(DEFAULT_STRATEGY); // Tilbakestill til default
         setResults(null); // Nullstill resultater
         // Optional: Fjern fra localStorage også?
         // localStorage.removeItem('tradeSimProStrategy');
    }
  }, []);

  // Beregn om API er operasjonelt (for å evt. deaktivere UI)
  const isApiOperational = !isLoadingTimeframes && availableTimeframes.length > 0;
  // console.log("[App.js Render] isApiOperational:", isApiOperational);


  // --- Render JSX ---
  console.log("[App.js Render] Rendering App component. Current strategy state:", strategy); // Logg strategy rett før render

  return (
    <div className="app">
      <Header
        selectedSymbol={selectedSymbol}
        onSymbolChange={handleSymbolChange} // Bruker useCallback versjon
      />

      <main className="app-main">
        <div className="container">
          {/* API Status Component */}
          <ApiStatus
                connected={!apiError} // Vis feil hvis apiError har innhold
                message={apiError}
                onRetry={handleRetryConnection}
           />

          {/* Hoved Grid Layout */}
          <div className="app-grid">

            {/* Sidebar (Strategy Configuration) */}
            <div className="app-sidebar">
              {/* Send ned den NYESTE strategy state og useCallback handler */}
              <StrategyConfig
                strategy={strategy}
                onStrategyChange={handleStrategyChange}
                disabled={!isApiOperational || isBacktestLoading} // Deaktiver under lasting/backtest
              />
            </div>

            {/* Main Content Area (Charts, Results) */}
            <div className="app-content">

              {/* Chart Controls (Timeframe Selector, etc.) */}
              <div className="chart-controls">
                <div className="timeframe-selector">
                  <span className="timeframe-label">Timeframe:</span>
                  {isLoadingTimeframes ? (
                    <span className="timeframe-loading">Loading...</span>
                  ) : availableTimeframes.length > 0 ? (
                    availableTimeframes.map(tf => (
                      <button
                        key={tf.id}
                        className={`timeframe-btn ${selectedTimeframe === tf.id ? 'active' : ''}`}
                        onClick={() => handleTimeframeChange(tf.id)} // Bruker useCallback versjon
                        disabled={isLoadingData || isBacktestLoading}
                      >
                        {tf.name} {/* Vis brukervennlig navn */}
                      </button>
                    ))
                  ) : (
                     // Fallback hvis API feilet - vis noen standardknapper
                     ['1d', '1wk', '1mo'].map(tfId => (
                        <button
                          key={tfId}
                          className={`timeframe-btn ${selectedTimeframe === tfId ? 'active' : ''}`}
                          onClick={() => handleTimeframeChange(tfId)}
                          disabled={isLoadingData || isBacktestLoading}
                         >
                           {tfId.toUpperCase()}
                         </button>
                      ))
                  )}
                </div>
                {/* Andre Chart-kontroller kan legges til her */}
              </div>

              {/* Price Chart */}
              <PriceChart
                data={marketData}
                isLoading={isLoadingData}
                symbol={selectedSymbol}
                // Send ned nøklene til indikatorer som *kan* finnes i data
                // Chartet må selv sjekke om data faktisk finnes for disse nøklene
                indicatorsInChart={['sma20', 'rsi', 'volume']}
              />

              {/* Backtest Controls (Run, Save, Reset) */}
              <div className="backtest-controls">
                <Button
                  variant="primary"
                  onClick={handleRunBacktest}
                  disabled={isBacktestLoading || isLoadingData || !marketData || marketData.length === 0 || !isApiOperational}
                >
                  {isBacktestLoading ? (
                      <> <span className="loading-spinner-inline" role="status" aria-hidden="true"></span> Running... </>
                    ) : 'Run Backtest'}
                </Button>
                 <Button variant="secondary" disabled={!isApiOperational || isBacktestLoading}>
                    Save Strategy {/* TODO: Implement Save Logic */}
                 </Button>
                 <Button
                    variant="secondary"
                    onClick={handleResetStrategy} // Bruker useCallback versjon
                    disabled={isBacktestLoading}
                 >
                    Reset Strategy
                 </Button>
              </div>

              {/* Results Area (Only show if results exist) */}
              {isBacktestLoading && ( // Vis en indikasjon under lasting av resultater
                  <div className="card">
                      <div className="card-body text-center">
                          <div className="loading-spinner" style={{margin: 'auto'}}></div>
                          <p>Calculating backtest results...</p>
                      </div>
                  </div>
              )}
              {!isBacktestLoading && results && (
                <div className="results-section">
                  <BacktestResults results={results} />
                  {/* Send kun trades hvis de finnes i results */}
                  {results.trades && results.trades.length > 0 && (
                      <TradeHistory trades={results.trades} />
                  )}
                   {results.trades && results.trades.length === 0 && (
                      <Panel title="Trade History">
                          <div className="no-trades">No trades executed during this backtest.</div>
                      </Panel>
                  )}
                </div>
              )}
              {/* Melding hvis ingen resultater finnes etter backtest */}
              {!isBacktestLoading && !results && (
                 <div className="card card-body text-center text-muted">
                    Run a backtest to see the results.
                 </div>
              )}

            </div> {/* End app-content */}
          </div> {/* End app-grid */}
        </div> {/* End container */}
      </main>

      <Footer />
    </div> // End app
  );
}

// Hjelpeklasse for inline spinner (kan ligge i App.css eller index.css)
/*
.loading-spinner-inline {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  border: 0.15em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border .75s linear infinite;
  margin-right: 0.5em;
}
@keyframes spinner-border { to { transform: rotate(360deg); } }
*/


export default App;