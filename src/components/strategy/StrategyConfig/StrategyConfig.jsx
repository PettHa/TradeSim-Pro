import React from 'react';
import { ArrowUp, ArrowDown, AlertTriangle, Settings } from 'lucide-react';
import Panel from '../../common/Panel/Panel';
import IndicatorConfig from '../IndicatorConfig/IndicatorConfig';
import RiskManagement from '../RiskManagement/RiskManagement';
import './StrategyConfig.css';

const StrategyConfig = ({ strategy, onStrategyChange }) => {
  const handleNameChange = (e) => {
    onStrategyChange({
      ...strategy,
      name: e.target.value
    });
  };
  
  const handleLongEnabledChange = (e) => {
    onStrategyChange({
      ...strategy,
      longEnabled: e.target.checked
    });
  };
  
  const handleShortEnabledChange = (e) => {
    onStrategyChange({
      ...strategy,
      shortEnabled: e.target.checked
    });
  };
  
  const addIndicator = (category, type) => {
    const newId = Math.max(0, ...strategy[category].map(i => i.id)) + 1;
    let newIndicator;
    
    if (type === 'SMA') {
      newIndicator = { id: newId, type: 'SMA', name: 'SMA Crossover', period: 20, condition: 'price_above' };
    } else if (type === 'RSI') {
      newIndicator = { id: newId, type: 'RSI', name: 'RSI', period: 14, overbought: 70, oversold: 30, condition: 'above_threshold' };
    } else if (type === 'MACD') {
      newIndicator = { 
        id: newId, 
        type: 'MACD', 
        name: 'MACD', 
        fastPeriod: 12, 
        slowPeriod: 26, 
        signalPeriod: 9, 
        condition: 'crossover' 
      };
    }
    
    onStrategyChange({
      ...strategy,
      [category]: [...strategy[category], newIndicator]
    });
  };
  
  const updateIndicator = (category, updatedIndicator) => {
    onStrategyChange({
      ...strategy,
      [category]: strategy[category].map(ind => 
        ind.id === updatedIndicator.id ? updatedIndicator : ind
      )
    });
  };
  
  const removeIndicator = (category, id) => {
    onStrategyChange({
      ...strategy,
      [category]: strategy[category].filter(ind => ind.id !== id)
    });
  };
  
  const handleRiskManagementChange = (updatedRiskManagement) => {
    onStrategyChange({
      ...strategy,
      ...updatedRiskManagement
    });
  };
  
  return (
    <div className="strategy-config">
      <Panel title="Strategy Configuration">
        <div className="form-group">
          <label className="form-label">Strategy Name</label>
          <input 
            type="text" 
            className="form-control"
            value={strategy.name}
            onChange={handleNameChange}
          />
        </div>
        
        <div className="strategy-position">
          <div className="strategy-position-header">
            <label className="form-check">
              <input 
                type="checkbox" 
                className="form-check-input"
                checked={strategy.longEnabled}
                onChange={handleLongEnabledChange}
              />
              <span className="form-check-label">Long Position</span>
            </label>
            <span className="position-badge position-badge-long">
              <ArrowUp size={16} className="position-badge-icon" />
              Long
            </span>
          </div>
          
          {strategy.longEnabled && (
            <>
              <div className="indicator-group long-entry">
                <h4 className="indicator-group-title">Long Entry Conditions</h4>
                {strategy.longEntryIndicators.map(indicator => (
                  <IndicatorConfig 
                    key={indicator.id}
                    indicator={indicator}
                    onChange={(updated) => updateIndicator('longEntryIndicators', updated)}
                    onRemove={() => removeIndicator('longEntryIndicators', indicator.id)}
                  />
                ))}
                <div className="indicator-actions">
                  <button 
                    className="btn btn-sm btn-success"
                    onClick={() => addIndicator('longEntryIndicators', 'SMA')}
                  >
                    Add SMA
                  </button>
                  <button 
                    className="btn btn-sm btn-success"
                    onClick={() => addIndicator('longEntryIndicators', 'RSI')}
                  >
                    Add RSI
                  </button>
                  <button 
                    className="btn btn-sm btn-success"
                    onClick={() => addIndicator('longEntryIndicators', 'MACD')}
                  >
                    Add MACD
                  </button>
                </div>
              </div>
              
              <div className="indicator-group long-exit">
                <h4 className="indicator-group-title">Long Exit Conditions</h4>
                {strategy.longExitIndicators.map(indicator => (
                  <IndicatorConfig 
                    key={indicator.id}
                    indicator={indicator}
                    onChange={(updated) => updateIndicator('longExitIndicators', updated)}
                    onRemove={() => removeIndicator('longExitIndicators', indicator.id)}
                  />
                ))}
                <div className="indicator-actions">
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => addIndicator('longExitIndicators', 'SMA')}
                  >
                    Add SMA
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => addIndicator('longExitIndicators', 'RSI')}
                  >
                    Add RSI
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => addIndicator('longExitIndicators', 'MACD')}
                  >
                    Add MACD
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="strategy-position">
          <div className="strategy-position-header">
            <label className="form-check">
              <input 
                type="checkbox" 
                className="form-check-input"
                checked={strategy.shortEnabled}
                onChange={handleShortEnabledChange}
              />
              <span className="form-check-label">Short Position</span>
            </label>
            <span className="position-badge position-badge-short">
              <ArrowDown size={16} className="position-badge-icon" />
              Short
            </span>
          </div>
          
          {strategy.shortEnabled && (
            <>
              <div className="indicator-group short-entry">
                <h4 className="indicator-group-title">Short Entry Conditions</h4>
                {strategy.shortEntryIndicators.map(indicator => (
                  <IndicatorConfig 
                    key={indicator.id}
                    indicator={indicator}
                    onChange={(updated) => updateIndicator('shortEntryIndicators', updated)}
                    onRemove={() => removeIndicator('shortEntryIndicators', indicator.id)}
                  />
                ))}
                <div className="indicator-actions">
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => addIndicator('shortEntryIndicators', 'SMA')}
                  >
                    Add SMA
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => addIndicator('shortEntryIndicators', 'RSI')}
                  >
                    Add RSI
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => addIndicator('shortEntryIndicators', 'MACD')}
                  >
                    Add MACD
                  </button>
                </div>
              </div>
              
              <div className="indicator-group short-exit">
                <h4 className="indicator-group-title">Short Exit Conditions</h4>
                {strategy.shortExitIndicators.map(indicator => (
                  <IndicatorConfig 
                    key={indicator.id}
                    indicator={indicator}
                    onChange={(updated) => updateIndicator('shortExitIndicators', updated)}
                    onRemove={() => removeIndicator('shortExitIndicators', indicator.id)}
                  />
                ))}
                <div className="indicator-actions">
                  <button 
                    className="btn btn-sm btn-success"
                    onClick={() => addIndicator('shortExitIndicators', 'SMA')}
                  >
                    Add SMA
                  </button>
                  <button 
                    className="btn btn-sm btn-success"
                    onClick={() => addIndicator('shortExitIndicators', 'RSI')}
                  >
                    Add RSI
                  </button>
                  <button 
                    className="btn btn-sm btn-success"
                    onClick={() => addIndicator('shortExitIndicators', 'MACD')}
                  >
                    Add MACD
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Panel>
      
      <RiskManagement 
        stopLoss={strategy.stopLoss}
        takeProfit={strategy.takeProfit}
        initialCapital={strategy.initialCapital}
        positionSize={strategy.positionSize}
        onChange={handleRiskManagementChange}
      />
    </div>
  );
};

export default StrategyConfig;