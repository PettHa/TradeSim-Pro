import React, { useState } from 'react';
import Panel from '../../common/Panel/Panel';
import { ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import './TradeHistory.css';

const TradeHistory = ({ trades }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'long', 'short', 'win', 'loss'
  
  const filteredTrades = trades.filter(trade => {
    // Apply search filter (if any)
    if (searchTerm && !trade.id.toString().includes(searchTerm) && 
        !trade.date.includes(searchTerm) && 
        !trade.type.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply type filter
    if (filter === 'long' && trade.type !== 'LONG') return false;
    if (filter === 'short' && trade.type !== 'SHORT') return false;
    if (filter === 'win' && trade.profit <= 0) return false;
    if (filter === 'loss' && trade.profit >= 0) return false;
    
    return true;
  });
  
  // Calculate summary stats for filtered trades
  const totalTrades = filteredTrades.length;
  const winningTrades = filteredTrades.filter(t => t.profit > 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : '0.00';
  const totalProfit = filteredTrades.reduce((sum, trade) => sum + trade.profit, 0).toFixed(2);
  
  return (
    <Panel title="Trade History">
      <div className="trade-history">
        <div className="trade-history-header">
          <div className="trade-filter">
            <div className="search-bar">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search trades..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-buttons">
              <Filter size={16} />
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${filter === 'long' ? 'active' : ''}`}
                onClick={() => setFilter('long')}
              >
                Long
              </button>
              <button 
                className={`filter-btn ${filter === 'short' ? 'active' : ''}`}
                onClick={() => setFilter('short')}
              >
                Short
              </button>
              <button 
                className={`filter-btn ${filter === 'win' ? 'active' : ''}`}
                onClick={() => setFilter('win')}
              >
                Winners
              </button>
              <button 
                className={`filter-btn ${filter === 'loss' ? 'active' : ''}`}
                onClick={() => setFilter('loss')}
              >
                Losers
              </button>
            </div>
          </div>
          
          <div className="trade-summary">
            <div className="summary-stat">
              <span className="summary-label">Trades:</span>
              <span className="summary-value">{totalTrades}</span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">Win Rate:</span>
              <span className="summary-value">{winRate}%</span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">Total P/L:</span>
              <span className={`summary-value ${parseFloat(totalProfit) >= 0 ? 'positive' : 'negative'}`}>
                ${totalProfit > 0 ? '+' : ''}{totalProfit}
              </span>
            </div>
          </div>
        </div>
        
        <div className="trades-table-container">
          <table className="trades-table">
            <thead>
              <tr>
                <th className="trade-id">#</th>
                <th className="trade-date">Date</th>
                <th className="trade-type">Type</th>
                <th className="trade-entry">Entry</th>
                <th className="trade-exit">Exit</th>
                <th className="trade-pl">P/L</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.length > 0 ? (
                filteredTrades.map(trade => (
                  <tr key={trade.id} className="trade-row">
                    <td className="trade-id">{trade.id}</td>
                    <td className="trade-date">{trade.date}</td>
                    <td className="trade-type">
                      <span className={`type-badge ${trade.type === 'LONG' ? 'long' : 'short'}`}>
                        {trade.type === 'LONG' ? (
                          <ArrowUp size={14} className="badge-icon" />
                        ) : (
                          <ArrowDown size={14} className="badge-icon" />
                        )}
                        {trade.type}
                      </span>
                    </td>
                    <td className="trade-entry">${trade.entry.toFixed(2)}</td>
                    <td className="trade-exit">${trade.exit.toFixed(2)}</td>
                    <td className={`trade-pl ${trade.profit >= 0 ? 'positive' : 'negative'}`}>
                      ${trade.profit > 0 ? '+' : ''}{trade.profit.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-trades">
                    No trades match the current filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
};

export default TradeHistory;