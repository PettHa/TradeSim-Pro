import React from 'react';
import Panel from '../../common/Panel/Panel';
import EquityChart from '../../chart/EquityChart/EquityChart';
import './BacktestResults.css';

const BacktestResults = ({ results }) => {
  const { 
    totalTrades, 
    winRate, 
    profitFactor, 
    netProfit, 
    maxDrawdown, 
    sharpeRatio,
    initialCapital = 10000
  } = results;
  
  // In a real app, this would come from actual backtest data
  const equityData = Array(30).fill(0).map((_, i) => ({
    date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
    equity: initialCapital * (1 + (i / 29) * parseFloat(netProfit) / initialCapital)
  }));
  
  const isPositiveReturn = parseFloat(netProfit) >= 0;
  
  return (
    <Panel title="Backtest Results">
      <div className="backtest-results">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Total Trades</div>
            <div className="stat-value">{totalTrades}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-title">Win Rate</div>
            <div className="stat-value">{winRate}%</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-title">Profit Factor</div>
            <div className="stat-value">{profitFactor}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-title">Net Profit</div>
            <div className={`stat-value ${isPositiveReturn ? 'positive' : 'negative'}`}>
              ${parseFloat(netProfit).toLocaleString()}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-title">Max Drawdown</div>
            <div className="stat-value negative">{maxDrawdown}%</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-title">Sharpe Ratio</div>
            <div className="stat-value">{sharpeRatio}</div>
          </div>
        </div>
        
        <div className="equity-section">
          <h3 className="section-title">Equity Curve</h3>
          <EquityChart data={equityData} initialCapital={initialCapital} />
        </div>
        
        <div className="report-actions">
          <button className="btn btn-primary">Export Full Report</button>
          <button className="btn btn-secondary">Save Strategy</button>
        </div>
      </div>
    </Panel>
  );
};

export default BacktestResults;