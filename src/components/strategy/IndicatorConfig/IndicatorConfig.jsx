import React from 'react';
import './IndicatorConfig.css';

const IndicatorConfig = ({ indicator, onChange, onRemove }) => {
  const handleChange = (field, value) => {
    onChange({
      ...indicator,
      [field]: value
    });
  };
  
  const renderIndicatorFields = () => {
    switch (indicator.type) {
      case 'SMA':
        return (
          <div className="indicator-param">
            <label className="indicator-param-label">Period:</label>
            <input 
              type="number" 
              className="form-control form-control-sm"
              value={indicator.period}
              onChange={(e) => handleChange('period', parseInt(e.target.value))}
              min={1}
            />
          </div>
        );
        
      case 'RSI':
        return (
          <>
            <div className="indicator-param">
              <label className="indicator-param-label">Period:</label>
              <input 
                type="number" 
                className="form-control form-control-sm"
                value={indicator.period}
                onChange={(e) => handleChange('period', parseInt(e.target.value))}
                min={1}
              />
            </div>
            <div className="indicator-param">
              <label className="indicator-param-label">Overbought:</label>
              <input 
                type="number" 
                className="form-control form-control-sm"
                value={indicator.overbought}
                onChange={(e) => handleChange('overbought', parseInt(e.target.value))}
                min={0}
                max={100}
              />
            </div>
            <div className="indicator-param">
              <label className="indicator-param-label">Oversold:</label>
              <input 
                type="number" 
                className="form-control form-control-sm"
                value={indicator.oversold}
                onChange={(e) => handleChange('oversold', parseInt(e.target.value))}
                min={0}
                max={100}
              />
            </div>
          </>
        );
        
      case 'MACD':
        return (
          <>
            <div className="indicator-param">
              <label className="indicator-param-label">Fast Period:</label>
              <input 
                type="number" 
                className="form-control form-control-sm"
                value={indicator.fastPeriod}
                onChange={(e) => handleChange('fastPeriod', parseInt(e.target.value))}
                min={1}
              />
            </div>
            <div className="indicator-param">
              <label className="indicator-param-label">Slow Period:</label>
              <input 
                type="number" 
                className="form-control form-control-sm"
                value={indicator.slowPeriod}
                onChange={(e) => handleChange('slowPeriod', parseInt(e.target.value))}
                min={1}
              />
            </div>
            <div className="indicator-param">
              <label className="indicator-param-label">Signal Period:</label>
              <input 
                type="number" 
                className="form-control form-control-sm"
                value={indicator.signalPeriod}
                onChange={(e) => handleChange('signalPeriod', parseInt(e.target.value))}
                min={1}
              />
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  const renderConditionOptions = () => {
    switch (indicator.type) {
      case 'SMA':
        return (
          <>
            <option value="price_above">Price above SMA</option>
            <option value="price_below">Price below SMA</option>
            <option value="price_cross_above">Price crosses above SMA</option>
            <option value="price_cross_below">Price crosses below SMA</option>
          </>
        );
        
      case 'RSI':
        return (
          <>
            <option value="above_threshold">Above threshold</option>
            <option value="below_threshold">Below threshold</option>
            <option value="cross_above">Crosses above threshold</option>
            <option value="cross_below">Crosses below threshold</option>
          </>
        );
        
      case 'MACD':
        return (
          <>
            <option value="crossover">Signal line crossover</option>
            <option value="above_zero">MACD above zero</option>
            <option value="below_zero">MACD below zero</option>
            <option value="cross_above_zero">MACD crosses above zero</option>
            <option value="cross_below_zero">MACD crosses below zero</option>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="indicator-config">
      <div className="indicator-header">
        <div className="indicator-name">
          <span className="indicator-badge">{indicator.type}</span>
          <input 
            type="text" 
            className="form-control form-control-sm indicator-name-input"
            value={indicator.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        <button 
          className="indicator-remove-btn"
          onClick={onRemove}
          title="Remove indicator"
        >
          &times;
        </button>
      </div>
      
      <div className="indicator-body">
        {renderIndicatorFields()}
        
        <div className="indicator-param">
          <label className="indicator-param-label">Condition:</label>
          <select 
            className="form-control form-control-sm"
            value={indicator.condition}
            onChange={(e) => handleChange('condition', e.target.value)}
          >
            {renderConditionOptions()}
          </select>
        </div>
      </div>
    </div>
  );
};

export default IndicatorConfig;