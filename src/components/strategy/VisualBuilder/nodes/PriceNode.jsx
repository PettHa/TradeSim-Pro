import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { TrendingUp, BarChart2 } from 'lucide-react';

// Price node component - represents market data source (OHLC, volume)
const PriceNode = memo(({ data, selected }) => {
  return (
    <div className={`strategy-node price-node ${selected ? 'selected' : ''}`}>
      <div className="node-label">
        {data.label || 'Market Data'}
      </div>
      
      <div className="node-content">
        <div className="flex items-center justify-center space-x-2 text-xs text-blue-900">
          <TrendingUp size={14} />
          <span>Price Data</span>
          <BarChart2 size={14} />
        </div>
        <div className="text-xs mt-2 text-gray-600">Source for strategy indicators</div>
      </div>
      
      {/* Output handles */}
      <div className="handle-container">
        <div className="handle-group ml-auto">
          <div>
            <span className="handle-label">Price</span>
            <Handle
              type="source"
              position={Position.Right}
              id="price"
              style={{ background: '#0041d0' }}
            />
          </div>
          <div>
            <span className="handle-label">Volume</span>
            <Handle
              type="source"
              position={Position.Right}
              id="volume"
              style={{ background: '#0041d0' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default PriceNode;