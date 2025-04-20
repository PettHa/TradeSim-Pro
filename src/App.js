// --- Fil: src/App.js ---

import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // Hoved-CSS for layout
import './index.css'; // Globale stiler og CSS-variabler

import Header from './layout/Header/Header';
import Footer from './layout/Footer/Footer';
// --- ERSTATT IMPORT ---
// import StrategyConfig from './components/strategy/StrategyConfig/StrategyConfig';
import VisualStrategyBuilder from './components/strategy/VisualBuilder/VisualStrategyBuilder'; // Importer den nye
// --- SLUTT ERSTATT IMPORT ---
import PriceChart from './components/chart/PriceChart/PriceChart';
import BacktestResults from './components/results/BacktestResults/BacktestResults';
import TradeHistory from './components/results/TradeHistory/TradeHistory';
import ApiStatus from './components/common/ApiStatus/ApiStatus';
import Button from './components/common/Button/Button'; // Felles knappekomponent

import { fetchCompleteMarketData, fetchAvailableTimeframes, fetchAvailableSymbols, retryApiCheck } from './services/marketData';
import { runBacktest } from './services/backtester';
import { DEFAULT_STRATEGY } from './constants'; // Importer standardstrategi (brukes for reset foreløpig)
import Panel from './components/common/Panel/Panel';

function App() {
  // --- State Hooks ---
  const [marketData, setMarketData] = useState([]);
  // --- VIKTIG: 'strategy' state holder foreløpig den GAMLE strukturen ---
  // Den visuelle byggeren håndterer sin egen node/edge-state internt for nå.
  const [strategy, setStrategy] = useState(() => {
      try {
          const savedStrategy = localStorage.getItem('tradeSimProStrategy');
          // TODO: Senere må vi lagre/laste node/edge-data for den visuelle byggeren
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
  // TODO: Dette lagrer fortsatt den GAMLE strategy-strukturen. Må oppdateres.
  useEffect(() => {
      try {
          localStorage.setItem('tradeSimProStrategy', JSON.stringify(strategy));
          console.log("[App.js Effect] Old strategy structure saved to localStorage.");
      } catch (e) {
          console.error("Error saving strategy to localStorage", e);
      }
  }, [strategy]); // Kjør hver gang strategy endres

  // --- Data Loading Logic (Uendret) ---
  const loadInitialData = useCallback(async (symbol, timeframe) => {
    setIsLoadingTimeframes(true);
    setIsLoadingData(true);
    setApiError('');
    console.log(`[App.js loadInitialData] Loading for ${symbol}, Timeframe: ${timeframe}`);
    let finalTimeframe = timeframe;
    try {
      const timeframes = await fetchAvailableTimeframes();
      setAvailableTimeframes(timeframes);
      if (timeframes.length > 0 && !timeframes.find(tf => tf.id === timeframe)) {
          finalTimeframe = timeframes[0].id;
          console.warn(`[App.js loadInitialData] Timeframe '${timeframe}' not available. Falling back to '${finalTimeframe}'.`);
          setSelectedTimeframe(finalTimeframe);
      } else if (timeframes.length === 0) {
          finalTimeframe = '1d'; setSelectedTimeframe(finalTimeframe);
      }
    } catch (error) {
        console.error('[App.js loadInitialData] Error loading timeframes:', error);
        setApiError(`Failed to load timeframes: ${error.message}.`);
    } finally { setIsLoadingTimeframes(false); }
    try {
        const data = await fetchCompleteMarketData(symbol, finalTimeframe, 500);
        console.log(`[App.js loadInitialData] Loaded ${data?.length || 0} market data points for ${symbol} (${finalTimeframe})`);
        setMarketData(data || []);
    } catch (error) {
        console.error(`[App.js loadInitialData] Error loading market data for ${symbol} (${finalTimeframe}):`, error);
        if (!apiError) { setApiError(`Failed to load market data for ${symbol}: ${error.message}.`); }
        setMarketData([]);
    } finally { setIsLoadingData(false); }
  }, [apiError]); // lagt til apiError dependency for re-run om nødvendig? Eller fjern.

  // Initial lasting ved mount (Uendret)
  useEffect(() => {
    console.log("[App.js Mount Effect] Triggering initial data load.");
    loadInitialData(selectedSymbol, selectedTimeframe);
  }, [loadInitialData, selectedSymbol, selectedTimeframe]); // lagt til symbol/tf her for re-run ved endring

   // Last markedsdata på nytt når symbol eller tidsramme endres (etter initiell lasting) (Uendret)
   useEffect(() => {
       if (!isLoadingTimeframes && !isLoadingData) {
            // Sjekk om symbol eller timeframe faktisk har endret seg siden sist data ble lastet
            // (Kan unngå unødig lasting hvis loadInitialData allerede håndterte det)
            // Dette er en forenkling, kan gjøres mer robust.
            console.log(`[App.js Symbol/Timeframe Effect] Maybe reloading market data for ${selectedSymbol} (${selectedTimeframe}).`);
            setIsLoadingData(true); setApiError('');
            fetchCompleteMarketData(selectedSymbol, selectedTimeframe, 500)
               .then(data => {
                   console.log(`[App.js Symbol/Timeframe Effect] Reloaded ${data?.length || 0} data points.`);
                   setMarketData(data || []);
               })
               .catch(error => {
                   console.error(`[App.js Symbol/Timeframe Effect] Error reloading market data:`, error);
                   setApiError(`Failed to load market data for ${selectedSymbol}: ${error.message}.`);
                   setMarketData([]);
               })
               .finally(() => { setIsLoadingData(false); });
       }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedSymbol, selectedTimeframe]); // Kjør kun ved symbol/timeframe endring etter init


  // --- API Retry (Uendret) ---
  const handleRetryConnection = async () => {
    console.log("[App.js] Retrying API connection...");
    setApiError(''); setIsLoadingTimeframes(true); setIsLoadingData(true);
    await retryApiCheck();
    loadInitialData(selectedSymbol, selectedTimeframe);
  };

  // --- Backtest Execution (Deaktivert for Visual Builder) ---
  const handleRunBacktest = async () => {
    // --- DEAKTIVERT MIDLERTIDIG ---
    alert("Running backtest from the visual builder is not implemented yet!");
    console.warn("[App.js] handleRunBacktest called, but visual parsing/execution is needed.");
    return;
    // --- SLUTT DEAKTIVERT ---

    /* // Gammel logikk (må tilpasses):
    if (!marketData || marketData.length === 0) {
      setApiError('Cannot run backtest: No market data available.');
      console.warn("[App.js handleRunBacktest] Aborted: No market data.");
      return;
    }
    // TODO: Trenger å parse den visuelle strategien her
    // const executableStrategy = parseVisualStrategy(nodes, edges); // Eksempel
    // if (!executableStrategy) {
    //      setApiError('Cannot run backtest: Strategy configuration is invalid or incomplete.');
    //      console.warn("[App.js handleRunBacktest] Aborted: Strategy parsing failed.");
    //      return;
    // }

    console.log("[App.js handleRunBacktest] Starting backtest...");
    setIsBacktestLoading(true);
    setResults(null);
    setApiError('');
    try {
      // TODO: Kjør backtest med den parsete strategien
      // const backtestResults = await runBacktest(executableStrategy, marketData);
      // console.log("[App.js handleRunBacktest] Backtest completed, results:", backtestResults);
      // setResults(backtestResults);
    } catch (error) {
      console.error('[App.js handleRunBacktest] Backtest error:', error);
      setApiError(`Backtest simulation failed: ${error.message}`);
      setResults(null);
    } finally {
      setIsBacktestLoading(false);
      console.log("[App.js handleRunBacktest] Backtest loading finished.");
    }
    */
  };

  // --- Strategy and UI Handlers ---

  // TODO: Denne må håndtere node/edge data fra VisualStrategyBuilder senere
  // For nå, la den gamle logikken for state-oppdatering ligge (selv om den ikke brukes av VisualBuilder)
  const handleStrategyChange = useCallback((changedData) => {
      console.log("[App.js handleStrategyChange] Received changes (currently affects old state structure):", changedData);
      setStrategy(prevStrategy => {
          const newStrategy = { ...prevStrategy, ...changedData };
          // console.log("[App.js handleStrategyChange] Updating state. Old:", prevStrategy);
          // console.log("[App.js handleStrategyChange] New state (old structure):", newStrategy);
          return newStrategy;
      });
      setResults(null); // Nullstill resultater når strategien (eller den visuelle grafen) endres
  }, []);

  const handleSymbolChange = useCallback((symbol) => {
    console.log(`[App.js handleSymbolChange] Symbol changed to: ${symbol}`);
    setSelectedSymbol(symbol); setResults(null); setMarketData([]);
  }, []);

  const handleTimeframeChange = useCallback((timeframeId) => {
    console.log(`[App.js handleTimeframeChange] Timeframe changed to: ${timeframeId}`);
    setSelectedTimeframe(timeframeId); setResults(null); setMarketData([]);
  }, []);

  // TODO: Denne må også resette state i VisualStrategyBuilder
  const handleResetStrategy = useCallback(() => {
    console.log("[App.js handleResetStrategy] Resetting strategy (old structure) to default.");
    if (window.confirm("Are you sure you want to reset the strategy to its default settings? (Visual builder state NOT reset yet)")) {
         setStrategy(DEFAULT_STRATEGY); // Tilbakestill gammel state
         setResults(null);
         // TODO: Kalle en reset-funksjon på VisualStrategyBuilder via ref?
    }
  }, []);

  // Beregn om API er operasjonelt (Uendret)
  const isApiOperational = !isLoadingTimeframes && availableTimeframes.length > 0;


  // --- Render JSX ---
  console.log("[App.js Render] Rendering App component.");

  return (
    <div className="app">
      <Header
        selectedSymbol={selectedSymbol}
        onSymbolChange={handleSymbolChange}
      />

      <main className="app-main">
        <div className="container">
          <ApiStatus
                connected={!apiError}
                message={apiError}
                onRetry={handleRetryConnection}
           />

          <div className="app-grid">

            {/* Sidebar (NÅ MED VISUAL BUILDER) */}
            <div className="app-sidebar">
              {/* --- ERSTATT KOMPONENT --- */}
              <VisualStrategyBuilder
                  // strategy={strategy} // Send lagret node/edge data hit senere
                  // onStrategyChange={handleStrategyChange} // Send callback for save/change senere
                  disabled={!isApiOperational || isBacktestLoading}
              />
              {/* --- SLUTT ERSTATT KOMPONENT --- */}
            </div>

            {/* Main Content Area (Charts, Results) */}
            <div className="app-content">

              <div className="chart-controls">
                <div className="timeframe-selector">
                  <span className="timeframe-label">Timeframe:</span>
                  {isLoadingTimeframes ? ( <span className="timeframe-loading">Loading...</span>
                  ) : availableTimeframes.length > 0 ? (
                    availableTimeframes.map(tf => (
                      <button key={tf.id} className={`timeframe-btn ${selectedTimeframe === tf.id ? 'active' : ''}`} onClick={() => handleTimeframeChange(tf.id)} disabled={isLoadingData || isBacktestLoading}> {tf.name} </button>
                    ))
                  ) : ( ['1d', '1wk', '1mo'].map(tfId => ( <button key={tfId} className={`timeframe-btn ${selectedTimeframe === tfId ? 'active' : ''}`} onClick={() => handleTimeframeChange(tfId)} disabled={isLoadingData || isBacktestLoading}> {tfId.toUpperCase()} </button> )) )}
                </div>
              </div>

              <PriceChart
                data={marketData}
                isLoading={isLoadingData}
                symbol={selectedSymbol}
                indicatorsInChart={['sma20', 'rsi', 'volume']} // Disse kommer kanskje ikke fra backend lenger?
              />

              {/* Backtest Controls */}
              <div className="backtest-controls">
                <Button
                  variant="primary"
                  onClick={handleRunBacktest}
                  // Deaktivert hvis backtest kjører, data lastes, API nede ELLER hvis visuell builder brukes (foreløpig)
                  disabled={isBacktestLoading || isLoadingData || !marketData || marketData.length === 0 || !isApiOperational}
                >
                  {isBacktestLoading ? ( <> <span className="loading-spinner-inline" role="status" aria-hidden="true"></span> Running... </> ) : 'Run Backtest'}
                </Button>
                 {/* TODO: Save-knapp må lagre den visuelle strategien */}
                 <Button variant="secondary" disabled={!isApiOperational || isBacktestLoading}> Save Strategy </Button>
                 {/* TODO: Reset-knapp må resette den visuelle strategien */}
                 <Button variant="secondary" onClick={handleResetStrategy} disabled={isBacktestLoading}> Reset Strategy </Button>
              </div>

              {/* Results Area */}
              {isBacktestLoading && (
                  <div className="card"><div className="card-body text-center"><div className="loading-spinner" style={{margin: 'auto'}}></div><p>Calculating backtest results...</p></div></div>
              )}
              {!isBacktestLoading && results && (
                <div className="results-section">
                  <BacktestResults results={results} />
                  {results.trades && results.trades.length > 0 && ( <TradeHistory trades={results.trades} /> )}
                   {results.trades && results.trades.length === 0 && ( <Panel title="Trade History"><div className="no-trades">No trades executed.</div></Panel> )}
                </div>
              )}
              {!isBacktestLoading && !results && ( <div className="card card-body text-center text-muted"> Run a backtest to see the results. </div> )}

            </div> {/* End app-content */}
          </div> {/* End app-grid */}
        </div> {/* End container */}
      </main>

      <Footer />
    </div> // End app
  );
}

export default App;