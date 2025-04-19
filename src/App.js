import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './layout/Header/Header';
import Footer from './layout/Footer/Footer';
import StrategyConfig from './components/strategy/StrategyConfig/StrategyConfig';
import PriceChart from './components/chart/PriceChart/PriceChart';
import BacktestResults from './components/results/BacktestResults/BacktestResults';
import TradeHistory from './components/results/TradeHistory/TradeHistory';
import { fetchMarketData } from './services/marketData';
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
  
  // Last data når komponenten monteres eller når symbol/timeframe endres
  useEffect(() => {
    const loadMarketData = async () => {
      setIsLoadingData(true);
      try {
        const data = await fetchMarketData(selectedSymbol, selectedTimeframe, 100);
        setMarketData(data);
      } catch (error) {
        console.error('Feil ved lasting av markedsdata:', error);
        // Kunne vist en feilmelding til brukeren her
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
              <div className="chart-controls">
                <div className="timeframe-selector">
                  <span className="timeframe-label">Tidsramme:</span>
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
                  {isLoading ? 'Kjører...' : 'Kjør Backtest'}
                </button>
                
                <button className="btn btn-secondary">
                  Lagre Strategi
                </button>
                
                <button 
                  className="btn btn-secondary"
                  onClick={handleResetStrategy}
                >
                  Tilbakestill
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