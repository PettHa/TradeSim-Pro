import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './layout/Header/Header';
import Footer from './layout/Footer/Footer';
import StrategyConfig from './components/strategy/StrategyConfig/StrategyConfig';
import PriceChart from './components/chart/PriceChart/PriceChart';
import BacktestResults from './components/results/BacktestResults/BacktestResults';
import TradeHistory from './components/results/TradeHistory/TradeHistory';
import ApiStatus from './components/common/ApiStatus/ApiStatus';
import { fetchMarketData, fetchCompleteMarketData } from './services/marketData';
import { runBacktest } from './services/backtester';
import { DEFAULT_STRATEGY } from './constants';

function App() {
  const [marketData, setMarketData] = useState([]);
  const [strategy, setStrategy] = useState(DEFAULT_STRATEGY);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [apiConnected, setApiConnected] = useState(true);
  const [apiError, setApiError] = useState('');
  
  // Check API availability
  const checkApiAvailability = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/market-data?symbol=AAPL&days=1`);
      const isConnected = response.ok;
      setApiConnected(isConnected);
      if (isConnected) {
        setApiError('');
      }
      return isConnected;
    } catch (error) {
      setApiConnected(false);
      setApiError(`Connection failed: ${error.message}`);
      return false;
    }
  };

  // Load data when component mounts or when symbol/timeframe changes
  useEffect(() => {
    const loadMarketData = async () => {
      setIsLoadingData(true);
      
      try {
        // Check API availability first
        const isApiAvailable = await checkApiAvailability();
        
        if (isApiAvailable) {
          // API is available, try to fetch complete market data
          try {
            const data = await fetchCompleteMarketData(selectedSymbol, selectedTimeframe, 100);
            console.log(`Loaded complete market data for ${selectedSymbol} with ${data.length} days`);
            setMarketData(data);
          } catch (error) {
            // Fallback to basic market data
            console.warn('Failed to fetch complete market data, falling back to basic data');
            const data = await fetchMarketData(selectedSymbol, selectedTimeframe, 100);
            console.log(`Loaded basic market data for ${selectedSymbol} with ${data.length} days`);
            setMarketData(data);
          }
        } else {
          // API is not available, use generated test data
          console.log('Using generated test data');
          const data = await fetchMarketData(selectedSymbol, selectedTimeframe, 100);
          setMarketData(data);
        }
      } catch (error) {
        console.error('Error loading market data:', error);
        setApiError(`Failed to load market data: ${error.message}`);
        setMarketData([]); // Set empty data array to avoid undefined errors
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadMarketData();
  }, [selectedSymbol, selectedTimeframe]);
  
  const handleRunBacktest = async () => {
    setIsLoading(true);
    try {
      const backtestResults = await runBacktest(strategy, marketData);
      setResults(backtestResults);
    } catch (error) {
      console.error('Backtest error:', error);
      // Handle error state
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStrategyChange = (updatedStrategy) => {
    setStrategy(updatedStrategy);
  };
  
  const handleSymbolChange = (symbol) => {
    setSelectedSymbol(symbol);
  };
  
  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
  };
  
  const handleResetStrategy = () => {
    setStrategy(DEFAULT_STRATEGY);
    setResults(null);
  };
  
  return (
    <div className="app">
      <Header 
        selectedSymbol={selectedSymbol}
        onSymbolChange={handleSymbolChange}
      />
      
      <main className="app-main">
        <div className="container">
          <div className="app-grid">
            <div className="app-sidebar">
              <StrategyConfig 
                strategy={strategy} 
                onStrategyChange={handleStrategyChange} 
              />
            </div>
            
            <div className="app-content">
              <ApiStatus 
                connected={apiConnected}
                message={apiError}
                onRetry={checkApiAvailability}
              />
              
              <div className="chart-controls">
                <div className="timeframe-selector">
                  <span className="timeframe-label">Timeframe:</span>
                  <button 
                    className={`timeframe-btn ${selectedTimeframe === '1d' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('1d')}
                  >
                    1D
                  </button>
                  <button 
                    className={`timeframe-btn ${selectedTimeframe === '1w' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('1w')}
                  >
                    1W
                  </button>
                  <button 
                    className={`timeframe-btn ${selectedTimeframe === '1M' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('1M')}
                  >
                    1M
                  </button>
                </div>
              </div>
            
              <PriceChart 
                data={marketData} 
                isLoading={isLoadingData}
                symbol={selectedSymbol}
                indicators={[
                  ...strategy.longEntryIndicators,
                  ...strategy.longExitIndicators,
                  ...strategy.shortEntryIndicators,
                  ...strategy.shortExitIndicators
                ]}
              />
              
              <div className="backtest-controls">
                <button 
                  className="btn btn-primary"
                  onClick={handleRunBacktest}
                  disabled={isLoading || isLoadingData}
                >
                  {isLoading ? 'Running...' : 'Run Backtest'}
                </button>
                
                <button className="btn btn-secondary">
                  Save Strategy
                </button>
                
                <button 
                  className="btn btn-secondary"
                  onClick={handleResetStrategy}
                >
                  Reset
                </button>
              </div>
              
              {results && (
                <div className="results-section">
                  <BacktestResults results={results} />
                  <TradeHistory trades={results.trades} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;