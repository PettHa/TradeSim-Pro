import React from 'react';
import { Sliders, TrendingUp, GitCompare, ActivitySquare, Play, HelpCircle } from 'lucide-react';

// Node configuration panel that changes based on the selected node type
function NodeConfig({ node, updateNodeData }) {
  if (!node) return null;

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to numbers
    const processedValue = type === 'number' ? parseFloat(value) : value;
    
    updateNodeData(node.id, { [name]: processedValue });
  };

  const renderNodeTypeIcon = () => {
    switch (node.type) {
      case 'priceNode':
        return <HelpCircle size={18} />;
      case 'indicatorNode':
        return <TrendingUp size={18} />;
      case 'conditionNode':
        return <GitCompare size={18} />;
      case 'logicNode':
        return <ActivitySquare size={18} />;
      case 'actionNode':
        return <Play size={18} />;
      default:
        return <Sliders size={18} />;
    }
  };

  // Different config forms based on node type
  const renderConfig = () => {
    switch (node.type) {
      case 'priceNode':
        return (
          <div className="node-config-form">
            <div className="form-group">
              <label className="form-label">Data Source</label>
              <select 
                className="form-select" 
                name="dataSource" 
                value={node.data.dataSource || 'close'} 
                onChange={handleChange}
              >
                <option value="close">Close Price</option>
                <option value="ohlc">OHLC (Open, High, Low, Close)</option>
                <option value="volume">Volume</option>
              </select>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This node represents the market data source for your strategy.
            </p>
          </div>
        );

      case 'indicatorNode':
        return (
          <div className="node-config-form">
            <div className="form-group">
              <label className="form-label">Indicator Type</label>
              <select 
                className="form-select" 
                name="indicatorType" 
                value={node.data.indicatorType || 'SMA'} 
                onChange={handleChange}
              >
                <option value="SMA">Simple Moving Average (SMA)</option>
                <option value="EMA">Exponential Moving Average (EMA)</option>
                <option value="RSI">Relative Strength Index (RSI)</option>
                <option value="MACD">MACD</option>
                <option value="BBANDS">Bollinger Bands</option>
                <option value="STOCH">Stochastic Oscillator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Label</label>
              <input 
                type="text" 
                className="form-input" 
                name="label" 
                value={node.data.label || ''} 
                onChange={handleChange} 
                placeholder="My Indicator"
              />
            </div>

            {/* Parameters based on indicator type */}
            {(node.data.indicatorType === 'SMA' || node.data.indicatorType === 'EMA') && (
              <div className="form-group">
                <label className="form-label">Period</label>
                <input 
                  type="number" 
                  className="form-input" 
                  name="period" 
                  value={node.data.period || 20} 
                  onChange={handleChange} 
                  min="1" 
                  max="200"
                />
              </div>
            )}

            {node.data.indicatorType === 'RSI' && (
              <>
                <div className="form-group">
                  <label className="form-label">Period</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="period" 
                    value={node.data.period || 14} 
                    onChange={handleChange} 
                    min="1" 
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Overbought Level</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="overbought" 
                    value={node.data.levels?.overbought || 70} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateNodeData(node.id, { 
                        levels: { ...node.data.levels, overbought: value } 
                      });
                    }} 
                    min="50" 
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Oversold Level</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="oversold" 
                    value={node.data.levels?.oversold || 30} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateNodeData(node.id, { 
                        levels: { ...node.data.levels, oversold: value } 
                      });
                    }} 
                    min="0" 
                    max="50"
                  />
                </div>
              </>
            )}

            {node.data.indicatorType === 'MACD' && (
              <>
                <div className="form-group">
                  <label className="form-label">Fast Period</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="fastPeriod" 
                    value={node.data.fastPeriod || 12} 
                    onChange={handleChange} 
                    min="1" 
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Slow Period</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="slowPeriod" 
                    value={node.data.slowPeriod || 26} 
                    onChange={handleChange} 
                    min="1" 
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Signal Period</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="signalPeriod" 
                    value={node.data.signalPeriod || 9} 
                    onChange={handleChange} 
                    min="1" 
                    max="100"
                  />
                </div>
              </>
            )}

            {node.data.indicatorType === 'BBANDS' && (
              <>
                <div className="form-group">
                  <label className="form-label">Period</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="period" 
                    value={node.data.period || 20} 
                    onChange={handleChange} 
                    min="1" 
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Standard Deviation</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="stdDev" 
                    value={node.data.stdDev || 2} 
                    onChange={handleChange} 
                    min="0.1" 
                    max="5" 
                    step="0.1"
                  />
                </div>
              </>
            )}

            {node.data.indicatorType === 'STOCH' && (
              <>
                <div className="form-group">
                  <label className="form-label">K Period</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="kPeriod" 
                    value={node.data.kPeriod || 14} 
                    onChange={handleChange} 
                    min="1" 
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">D Period</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="dPeriod" 
                    value={node.data.dPeriod || 3} 
                    onChange={handleChange} 
                    min="1" 
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Slowing</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    name="slowing" 
                    value={node.data.slowing || 3} 
                    onChange={handleChange} 
                    min="1" 
                    max="100"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 'conditionNode':
        return (
          <div className="node-config-form">
            <div className="form-group">
              <label className="form-label">Condition Type</label>
              <select 
                className="form-select" 
                name="conditionType" 
                value={node.data.conditionType || 'GT'} 
                onChange={handleChange}
              >
                <option value="GT">Greater Than (&gt;)</option>
                <option value="LT">Less Than (&lt;)</option>
                <option value="EQ">Equals (=)</option>
                <option value="CROSS_ABOVE">Crosses Above</option>
                <option value="CROSS_BELOW">Crosses Below</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Label</label>
              <input 
                type="text" 
                className="form-input" 
                name="label" 
                value={node.data.label || ''} 
                onChange={handleChange} 
                placeholder="Condition Label"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Threshold Value</label>
              <input 
                type="number" 
                className="form-input" 
                name="threshold" 
                value={node.data.threshold || 0} 
                onChange={handleChange}
                step="any"
              />
              <span className="text-xs text-gray-500">
                Optional: Used when comparing to a fixed value
              </span>
            </div>
          </div>
        );

      case 'logicNode':
        return (
          <div className="node-config-form">
            <div className="form-group">
              <label className="form-label">Logic Type</label>
              <select 
                className="form-select" 
                name="logicType" 
                value={node.data.logicType || 'AND'} 
                onChange={handleChange}
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
                <option value="NOT">NOT</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Label</label>
              <input 
                type="text" 
                className="form-input" 
                name="label" 
                value={node.data.label || ''} 
                onChange={handleChange} 
                placeholder="Logic Gate"
              />
            </div>
          </div>
        );

      case 'actionNode':
        return (
          <div className="node-config-form">
            <div className="form-group">
              <label className="form-label">Action Type</label>
              <select 
                className="form-select" 
                name="actionType" 
                value={node.data.actionType || 'ENTRY'} 
                onChange={handleChange}
              >
                <option value="ENTRY">Entry</option>
                <option value="EXIT">Exit</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Position Type</label>
              <select 
                className="form-select" 
                name="positionType" 
                value={node.data.positionType || 'LONG'} 
                onChange={handleChange}
              >
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Label</label>
              <input 
                type="text" 
                className="form-input" 
                name="label" 
                value={node.data.label || ''} 
                onChange={handleChange} 
                placeholder="Action Label"
              />
            </div>
          </div>
        );

      default:
        return <p>Unknown node type: {node.type}</p>;
    }
  };

  return (
    <div className="node-config-panel">
      <div className="node-config-title">
        {renderNodeTypeIcon()}
        <span>
          {node.type === 'priceNode' ? 'Market Data' : 
           node.type === 'indicatorNode' ? 'Indicator Settings' :
           node.type === 'conditionNode' ? 'Condition Settings' :
           node.type === 'logicNode' ? 'Logic Gate Settings' :
           node.type === 'actionNode' ? 'Action Settings' : 'Node Settings'}
        </span>
      </div>
      
      {renderConfig()}
    </div>
  );
}

export default NodeConfig;