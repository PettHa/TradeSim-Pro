import React from 'react';
import { TrendingUp, GitCompare, ActivitySquare, Play, Table2 } from 'lucide-react';

// Node types and their configurations
const NODE_TYPES = [
  {
    category: 'Indicators',
    items: [
      { type: 'indicatorNode', label: 'SMA', data: { label: 'SMA', indicatorType: 'SMA', period: 20 } },
      { type: 'indicatorNode', label: 'EMA', data: { label: 'EMA', indicatorType: 'EMA', period: 20 } },
      { type: 'indicatorNode', label: 'RSI', data: { label: 'RSI', indicatorType: 'RSI', period: 14, levels: { oversold: 30, overbought: 70 } } },
      { type: 'indicatorNode', label: 'MACD', data: { label: 'MACD', indicatorType: 'MACD', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } },
      { type: 'indicatorNode', label: 'Bollinger Bands', data: { label: 'Bollinger', indicatorType: 'BBANDS', period: 20, stdDev: 2 } },
      { type: 'indicatorNode', label: 'Stochastic', data: { label: 'Stoch', indicatorType: 'STOCH', kPeriod: 14, dPeriod: 3, slowing: 3 } }
    ]
  },
  {
    category: 'Conditions',
    items: [
      { type: 'conditionNode', label: 'Greater Than', data: { label: '>', conditionType: 'GT' } },
      { type: 'conditionNode', label: 'Less Than', data: { label: '<', conditionType: 'LT' } },
      { type: 'conditionNode', label: 'Equals', data: { label: '=', conditionType: 'EQ' } },
      { type: 'conditionNode', label: 'Crosses Above', data: { label: 'Crosses ↑', conditionType: 'CROSS_ABOVE' } },
      { type: 'conditionNode', label: 'Crosses Below', data: { label: 'Crosses ↓', conditionType: 'CROSS_BELOW' } }
    ]
  },
  {
    category: 'Logic',
    items: [
      { type: 'logicNode', label: 'AND', data: { label: 'AND', logicType: 'AND' } },
      { type: 'logicNode', label: 'OR', data: { label: 'OR', logicType: 'OR' } },
      { type: 'logicNode', label: 'NOT', data: { label: 'NOT', logicType: 'NOT' } }
    ]
  },
  {
    category: 'Actions',
    items: [
      { type: 'actionNode', label: 'Long Entry', data: { label: 'Enter Long', actionType: 'ENTRY', positionType: 'LONG' } },
      { type: 'actionNode', label: 'Long Exit', data: { label: 'Exit Long', actionType: 'EXIT', positionType: 'LONG' } },
      { type: 'actionNode', label: 'Short Entry', data: { label: 'Enter Short', actionType: 'ENTRY', positionType: 'SHORT' } },
      { type: 'actionNode', label: 'Short Exit', data: { label: 'Exit Short', actionType: 'EXIT', positionType: 'SHORT' } }
    ]
  }
];

// Get icon for node type
const getNodeIcon = (type) => {
  switch (type) {
    case 'indicatorNode':
      return <TrendingUp size={16} />;
    case 'conditionNode':
      return <GitCompare size={16} />;
    case 'logicNode':
      return <ActivitySquare size={16} />;
    case 'actionNode':
      return <Play size={16} />;
    default:
      return <Table2 size={16} />;
  }
};

// Get CSS class for node type icon background
const getIconClass = (type) => {
  switch (type) {
    case 'indicatorNode':
      return 'indicator';
    case 'conditionNode':
      return 'condition';
    case 'logicNode':
      return 'logic';
    case 'actionNode':
      return 'action';
    default:
      return '';
  }
};

// NodePicker component - displays a menu of node types to add to the flow
function NodePicker({ position, onSelect, onClose }) {
  return (
    <div 
      className="node-picker"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="node-picker-title">Add Node</div>
      <div className="node-picker-items">
        {NODE_TYPES.map((category) => (
          <React.Fragment key={category.category}>
            {category.items.map((item) => (
              <div 
                key={`${item.type}-${item.label}`}
                className="node-picker-item"
                onClick={() => onSelect(item.type, item.data)}
              >
                <div className={`node-picker-item-icon ${getIconClass(item.type)}`}>
                  {getNodeIcon(item.type)}
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default NodePicker;