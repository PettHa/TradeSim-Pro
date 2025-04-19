import React, { useState } from 'react';
import { Settings, HelpCircle, Search } from 'lucide-react';
import { generateAvailableSymbols } from '../../services/dataGenerator';
import './Header.css';

const Header = ({ selectedSymbol = 'AAPL', onSymbolChange }) => {
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableSymbols, setAvailableSymbols] = useState(generateAvailableSymbols());
  
  const handleSymbolClick = (symbol) => {
    if (onSymbolChange) {
      onSymbolChange(symbol);
    }
    setShowSymbolSearch(false);
    setSearchTerm('');
  };
  
  const filteredSymbols = searchTerm.trim() === '' 
    ? availableSymbols 
    : availableSymbols.filter(s => 
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-brand">
            <h1 className="header-logo">TradeSim Pro</h1>
            <p className="header-tagline">Trading Strategi Backtester</p>
          </div>
          
          <div className="symbol-selector">
            <div 
              className="selected-symbol"
              onClick={() => setShowSymbolSearch(!showSymbolSearch)}
            >
              <span className="symbol-text">{selectedSymbol}</span>
              <span className="symbol-arrow">▼</span>
            </div>
            
            {showSymbolSearch && (
              <div className="symbol-dropdown">
                <div className="symbol-search">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Søk etter symbol..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="symbol-list">
                  {filteredSymbols.length > 0 ? (
                    filteredSymbols.map((symbol) => (
                      <div 
                        key={symbol.symbol} 
                        className="symbol-item"
                        onClick={() => handleSymbolClick(symbol.symbol)}
                      >
                        <div className="symbol-code">{symbol.symbol}</div>
                        <div className="symbol-name">{symbol.name}</div>
                        <div className="symbol-type">{symbol.type}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-symbols">Ingen symboler funnet</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="header-actions">
            <button className="header-action-btn" title="Innstillinger">
              <Settings size={20} />
            </button>
            <button className="header-action-btn" title="Hjelp">
              <HelpCircle size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;