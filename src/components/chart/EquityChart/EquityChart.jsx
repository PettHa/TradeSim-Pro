import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './EquityChart.css';

const EquityChart = ({ data, initialCapital }) => {
  const formatYAxis = (value) => {
    return `$${value.toLocaleString()}`;
  };
  
  const formatTooltip = (value) => {
    return [`$${value.toLocaleString()}`, 'Equity'];
  };
  
  // Calculate max drawdown point for reference line
  const minEquity = Math.min(...data.map(d => d.equity));
  const maxEquity = Math.max(...data.map(d => d.equity));
  
  // Calculate starting point and ending point
  const startEquity = data[0]?.equity || initialCapital;
  const endEquity = data[data.length - 1]?.equity || startEquity;
  
  // Calculate performance
  const performancePercent = ((endEquity - startEquity) / startEquity * 100).toFixed(2);
  const isPositive = endEquity >= startEquity;
  
  return (
    <div className="equity-chart-container">
      <div className="equity-summary">
        <div className="equity-summary-item">
          <span className="equity-summary-label">Starting Equity</span>
          <span className="equity-summary-value">${startEquity.toLocaleString()}</span>
        </div>
        <div className="equity-summary-item">
          <span className="equity-summary-label">Current Equity</span>
          <span className="equity-summary-value">${endEquity.toLocaleString()}</span>
        </div>
        <div className="equity-summary-item">
          <span className="equity-summary-label">Performance</span>
          <span className={`equity-summary-value ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{performancePercent}%
          </span>
        </div>
        <div className="equity-summary-item">
          <span className="equity-summary-label">Max Drawdown</span>
          <span className="equity-summary-value negative">
            {maxEquity > 0 ? `-${(((maxEquity - minEquity) / maxEquity) * 100).toFixed(2)}%` : '0%'}
          </span>
        </div>
      </div>
      
      <div className="equity-chart">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <ReferenceLine 
              y={initialCapital} 
              stroke="#666" 
              strokeDasharray="3 3" 
              label={{ 
                value: "Initial Capital", 
                position: "insideBottomRight",
                fill: "#666",
                fontSize: 12
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="equity" 
              stroke="#3b82f6" 
              dot={false}
              name="Equity"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EquityChart;