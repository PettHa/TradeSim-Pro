import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { ChevronDown } from 'lucide-react';

// Indicator node component with in-node editing
const IndicatorNode = ({ data, selected, id, isConnectable, updateNodeData }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Indicator types
  const indicatorTypes = [
    { value: 'SMA', label: 'Simple Moving Average' },
    { value: 'EMA', label: 'Exponential Moving Average' },
    { value: 'RSI', label: 'Relative Strength Index' },
    { value: 'MACD', label: 'MACD' },
    { value: 'BBANDS', label: 'Bollinger Bands' },
    { value: 'STOCH', label: 'Stochastic' }
  ];

  // Find current indicator type
  const currentIndicator = indicatorTypes.find(i => i.value === (data.indicatorType || 'SMA')) || indicatorTypes[0];

  // Handle input changes
  const handleChange = (field, value) => {
    if (updateNodeData && id) {
      // Convert number inputs
      let processedValue = value;
      if (field !== 'indicatorType' && field !== 'label') {
        processedValue = parseFloat(value);
      }
      
      // Update the node data
      updateNodeData(id, { [field]: processedValue });
    }
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Generate parameters based on indicator type
  const renderParameters = () => {
    if (!isEditing) return null;

    switch (data.indicatorType) {
      case 'SMA':
      case 'EMA':
        return (
          <div className="node-param-group">
            <label className="node-param-label">Period:</label>
            <input
              type="number"
              className="node-input"
              value={data.period || 20}
              onChange={(e) => handleChange('period', e.target.value)}
              min="1"
            />
          </div>
        );
      
      case 'RSI':
        return (
          <>
            <div className="node-param-group">
              <label className="node-param-label">Period:</label>
              <input
                type="number"
                className="node-input"
                value={data.period || 14}
                onChange={(e) => handleChange('period', e.target.value)}
                min="1"
              />
            </div>
            <div className="node-param-group">
              <label className="node-param-label">Overbought:</label>
              <input
                type="number"
                className="node-input"
                value={(data.levels?.overbought || 70)}
                onChange={(e) => {
                  const newLevels = { ...(data.levels || {}), overbought: parseFloat(e.target.value) };
                  handleChange('levels', newLevels);
                }}
                min="50"
                max="100"
              />
            </div>
            <div className="node-param-group">
              <label className="node-param-label">Oversold:</label>
              <input
                type="number"
                className="node-input"
                value={(data.levels?.oversold || 30)}
                onChange={(e) => {
                  const newLevels = { ...(data.levels || {}), oversold: parseFloat(e.target.value) };
                  handleChange('levels', newLevels);
                }}
                min="0"
                max="50"
              />
            </div>
          </>
        );
      
      case 'MACD':
        return (
          <>
            <div className="node-param-group">
              <label className="node-param-label">Fast Period:</label>
              <input
                type="number"
                className="node-input"
                value={data.fastPeriod || 12}
                onChange={(e) => handleChange('fastPeriod', e.target.value)}
                min="1"
              />
            </div>
            <div className="node-param-group">
              <label className="node-param-label">Slow Period:</label>
              <input
                type="number"
                className="node-input"
                value={data.slowPeriod || 26}
                onChange={(e) => handleChange('slowPeriod', e.target.value)}
                min="1"
              />
            </div>
            <div className="node-param-group">
              <label className="node-param-label">Signal:</label>
              <input
                type="number"
                className="node-input"
                value={data.signalPeriod || 9}
                onChange={(e) => handleChange('signalPeriod', e.target.value)}
                min="1"
              />
            </div>
          </>
        );
      
      case 'BBANDS':
        return (
          <>
            <div className="node-param-group">
              <label className="node-param-label">Period:</label>
              <input
                type="number"
                className="node-input"
                value={data.period || 20}
                onChange={(e) => handleChange('period', e.target.value)}
                min="1"
              />
            </div>
            <div className="node-param-group">
              <label className="node-param-label">StdDev:</label>
              <input
                type="number"
                className="node-input"
                value={data.stdDev || 2}
                onChange={(e) => handleChange('stdDev', e.target.value)}
                min="0.1"
                step="0.1"
              />
            </div>
          </>
        );
      
      case 'STOCH':
        return (
          <>
            <div className="node-param-group">
              <label className="node-param-label">K Period:</label>
              <input
                type="number"
                className="node-input"
                value={data.kPeriod || 14}
                onChange={(e) => handleChange('kPeriod', e.target.value)}
                min="1"
              />
            </div>
            <div className="node-param-group">
              <label className="node-param-label">D Period:</label>
              <input
                type="number"
                className="node-input"
                value={data.dPeriod || 3}
                onChange={(e) => handleChange('dPeriod', e.target.value)}
                min="1"
              />
            </div>
            <div className="node-param-group">
              <label className="node-param-label">Slowing:</label>
              <input
                type="number"
                className="node-input"
                value={data.slowing || 3}
                onChange={(e) => handleChange('slowing', e.target.value)}
                min="1"
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  // Generate output handles based on indicator type
  const renderOutputHandles = () => {
    switch (data.indicatorType) {
      case 'SMA':
      case 'EMA':
        return (
          <div className="connection-outputs">
            <Handle
              type="source"
              position={Position.Right}
              id="value"
              className="output-handle"
              isConnectable={isConnectable}
            />
            <div className="connection-label">Value</div>
          </div>
        );
      
      case 'RSI':
        return (
          <div className="connection-outputs">
            <Handle
              type="source"
              position={Position.Right}
              id="value"
              className="output-handle output-main"
              style={{ top: '40%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">RSI</div>
            
            <Handle
              type="source"
              position={Position.Right}
              id="overbought"
              className="output-handle output-secondary"
              style={{ top: '60%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">Overbought</div>
            
            <Handle
              type="source"
              position={Position.Right}
              id="oversold"
              className="output-handle output-secondary"
              style={{ top: '80%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">Oversold</div>
          </div>
        );
      
      case 'MACD':
        return (
          <div className="connection-outputs">
            <Handle
              type="source"
              position={Position.Right}
              id="macd"
              className="output-handle output-main"
              style={{ top: '40%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">MACD</div>
            
            <Handle
              type="source"
              position={Position.Right}
              id="signal"
              className="output-handle output-secondary"
              style={{ top: '60%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">Signal</div>
            
            <Handle
              type="source"
              position={Position.Right}
              id="hist"
              className="output-handle output-secondary"
              style={{ top: '80%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">Histogram</div>
          </div>
        );
      
      case 'BBANDS':
        return (
          <div className="connection-outputs">
            <Handle
              type="source"
              position={Position.Right}
              id="upper"
              className="output-handle output-secondary"
              style={{ top: '40%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">Upper</div>
            
            <Handle
              type="source"
              position={Position.Right}
              id="middle"
              className="output-handle output-main"
              style={{ top: '60%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">Middle</div>
            
            <Handle
              type="source"
              position={Position.Right}
              id="lower"
              className="output-handle output-secondary"
              style={{ top: '80%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">Lower</div>
          </div>
        );
      
      case 'STOCH':
        return (
          <div className="connection-outputs">
            <Handle
              type="source"
              position={Position.Right}
              id="k"
              className="output-handle output-main"
              style={{ top: '45%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">%K</div>
            
            <Handle
              type="source"
              position={Position.Right}
              id="d"
              className="output-handle output-secondary"
              style={{ top: '75%' }}
              isConnectable={isConnectable}
            />
            <div className="connection-label">%D</div>
          </div>
        );
      
      default:
        return (
          <div className="connection-outputs">
            <Handle
              type="source"
              position={Position.Right}
              id="value"
              className="output-handle"
              isConnectable={isConnectable}
            />
            <div className="connection-label">Value</div>
          </div>
        );
    }
  };

  // Generate the subtitle (parameters summary)
  const getSubtitle = () => {
    if (isEditing) return null;
    
    switch (data.indicatorType) {
      case 'SMA':
      case 'EMA':
        return `Period: ${data.period || 20}`;
      case 'RSI':
        return `Period: ${data.period || 14}, Levels: ${data.levels?.oversold || 30}/${data.levels?.overbought || 70}`;
      case 'MACD':
        return `${data.fastPeriod || 12}/${data.slowPeriod || 26}/${data.signalPeriod || 9}`;
      case 'BBANDS':
        return `Period: ${data.period || 20}, σ: ${data.stdDev || 2}`;
      case 'STOCH':
        return `K: ${data.kPeriod || 14}, D: ${data.dPeriod || 3}, S: ${data.slowing || 3}`;
      default:
        return 'Technical Indicator';
    }
  };

  return (
    <div className={`strategy-node indicator-node ${selected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}>
      {/* Node Header */}
      <div className="node-header" onClick={toggleEdit}>
        <div className="node-title">
          {data.label || data.indicatorType || 'Indicator'}
        </div>
        <ChevronDown className="edit-toggle-icon" size={14} />
      </div>
      
      {/* Indicator Type Selector */}
      {isEditing && (
        <div className="node-param-group">
          <label className="node-param-label">Type:</label>
          <select
            className="node-select"
            value={data.indicatorType || 'SMA'}
            onChange={(e) => handleChange('indicatorType', e.target.value)}
          >
            {indicatorTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Subtitle with Parameters Summary */}
      {!isEditing && (
        <div className="node-subtitle">
          {getSubtitle()}
        </div>
      )}
      
      {/* Parameters */}
      {renderParameters()}
      
      {/* Node Connections */}
      <div className="node-connections">
        {/* Input Handle */}
        <div className="connection-inputs">
          <Handle
            type="target"
            position={Position.Left}
            id="in"
            className="input-handle"
            isConnectable={isConnectable}
          />
          <div className="connection-label">Input</div>
        </div>
        
        {/* Output Handles */}
        {renderOutputHandles()}
      </div>
    </div>
  );
};

export default IndicatorNode;