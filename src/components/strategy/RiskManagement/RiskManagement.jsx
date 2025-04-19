import React from 'react';
import Panel from '../../common/Panel/Panel';
import { AlertTriangle, Settings } from 'lucide-react';
import './RiskManagement.css';

const RiskManagement = ({ 
  stopLoss, 
  takeProfit, 
  initialCapital, 
  positionSize, 
  onChange 
}) => {
  const handleStopLossChange = (e) => {
    onChange({ stopLoss: parseFloat(e.target.value) });
  };
  
  const handleTakeProfitChange = (e) => {
    onChange({ takeProfit: parseFloat(e.target.value) });
  };
  
  const handleInitialCapitalChange = (e) => {
    onChange({ initialCapital: parseFloat(e.target.value) });
  };
  
  const handlePositionSizeChange = (e) => {
    onChange({ positionSize: parseFloat(e.target.value) });
  };
  
  return (
    <div className="risk-management">
      <Panel title="Risk Management">
        <div className="risk-section">
          <h4 className="risk-section-title">
            <AlertTriangle size={18} className="risk-section-icon" />
            Stop Loss & Take Profit
          </h4>
          
          <div className="risk-params">
            <div className="form-group">
              <label className="form-label">Stop Loss (%)</label>
              <input 
                type="number" 
                className="form-control"
                value={stopLoss}
                onChange={handleStopLossChange}
                min={0}
                step={0.1}
              />
              <small className="form-text">Maximum loss before exiting position</small>
            </div>
            
            <div className="form-group">
              <label className="form-label">Take Profit (%)</label>
              <input 
                type="number" 
                className="form-control"
                value={takeProfit}
                onChange={handleTakeProfitChange}
                min={0}
                step={0.1}
              />
              <small className="form-text">Target profit to close position</small>
            </div>
          </div>
        </div>
        
        <div className="risk-section">
          <h4 className="risk-section-title">
            <Settings size={18} className="risk-section-icon" />
            Capital & Position
          </h4>
          
          <div className="risk-params">
            <div className="form-group">
              <label className="form-label">Initial Capital</label>
              <input 
                type="number" 
                className="form-control"
                value={initialCapital}
                onChange={handleInitialCapitalChange}
                min={0}
                step={100}
              />
              <small className="form-text">Starting account balance</small>
            </div>
            
            <div className="form-group">
              <label className="form-label">Position Size (%)</label>
              <input 
                type="number" 
                className="form-control"
                value={positionSize}
                onChange={handlePositionSizeChange}
                min={0}
                max={100}
                step={1}
              />
              <small className="form-text">Percentage of capital per trade</small>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default RiskManagement;