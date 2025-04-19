import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Panel from '../../common/Panel/Panel';
import './PriceChart.css';

const PriceChart = ({ data, indicators = [], isLoading = false, symbol = 'DEMO' }) => {
  const [activeIndicators, setActiveIndicators] = useState({
    price: true,
    volume: false,
    sma: true,
    rsi: false,
    macd: false
  });
  
  const toggleIndicator = (indicator) => {
    setActiveIndicators({
      ...activeIndicators,
      [indicator]: !activeIndicators[indicator]
    });
  };
  
  // Generate colors for different indicators
  const getIndicatorColor = (type, index) => {
    const baseColors = {
      price: '#8884d8',
      volume: '#82ca9d',
      sma: (idx) => ['#ff7300', '#387908', '#38abc8'][idx % 3],
      rsi: '#ff8042',
      macd: '#ff0000'
    };
    
    return baseColors[type] instanceof Function ? baseColors[type](index) : baseColors[type];
  };
  
  // Filter SMA indicators and get their periods
  const smaIndicators = indicators.filter(i => i.type === 'SMA');
  
  // Viser en lastestatus når data hentes
  const renderLoadingState = () => (
    <div className="chart-loading">
      <div className="loading-spinner"></div>
      <p>Laster markedsdata...</p>
    </div>
  );
  
  // Viser en tom tilstand når det ikke er noe data
  const renderEmptyState = () => (
    <div className="chart-empty">
      <p>Ingen markedsdata tilgjengelig for {symbol}</p>
    </div>
  );
  
  return (
    <Panel title={`Prischart - ${symbol}`}>
      <div className="price-chart-container">
        <div className="price-chart-header">
          <div className="indicator-toggles">
            <label className="indicator-toggle">
              <input 
                type="checkbox" 
                checked={activeIndicators.price} 
                onChange={() => toggleIndicator('price')}
              />
              <span className="indicator-toggle-label">Pris</span>
            </label>
            
            <label className="indicator-toggle">
              <input 
                type="checkbox" 
                checked={activeIndicators.volume} 
                onChange={() => toggleIndicator('volume')}
              />
              <span className="indicator-toggle-label">Volum</span>
            </label>
            
            <label className="indicator-toggle">
              <input 
                type="checkbox" 
                checked={activeIndicators.sma} 
                onChange={() => toggleIndicator('sma')}
              />
              <span className="indicator-toggle-label">SMA</span>
            </label>
            
            <label className="indicator-toggle">
              <input 
                type="checkbox" 
                checked={activeIndicators.rsi} 
                onChange={() => toggleIndicator('rsi')}
              />
              <span className="indicator-toggle-label">RSI</span>
            </label>
            
            <label className="indicator-toggle">
              <input 
                type="checkbox" 
                checked={activeIndicators.macd} 
                onChange={() => toggleIndicator('macd')}
              />
              <span className="indicator-toggle-label">MACD</span>
            </label>
          </div>
        </div>
        
        <div className="chart-container">
          {isLoading ? (
            renderLoadingState()
          ) : data.length === 0 ? (
            renderEmptyState()
          ) : (
            <ResponsiveContainer width="100%" height={400}>
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
                  yAxisId="price"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                />
                {activeIndicators.volume && (
                  <YAxis 
                    yAxisId="volume"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                  />
                )}
                <Tooltip 
                  formatter={(value, name) => [
                    value.toFixed(2), 
                    name === 'price' ? 'Pris' : name.startsWith('sma') ? `SMA(${name.substring(3)})` : name
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                
                {activeIndicators.price && (
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={getIndicatorColor('price')} 
                    activeDot={{ r: 8 }} 
                    yAxisId="price"
                    name="Pris"
                  />
                )}
                
                {activeIndicators.volume && (
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke={getIndicatorColor('volume')} 
                    yAxisId="volume"
                    name="Volum"
                  />
                )}
                
                {activeIndicators.sma && smaIndicators.map((indicator, index) => (
                  <Line 
                    key={`sma-${indicator.id}`}
                    type="monotone" 
                    dataKey="sma20" // In a real app, this would be dynamic based on the period
                    stroke={getIndicatorColor('sma', index)} 
                    yAxisId="price"
                    name={`SMA(${indicator.period})`}
                    dot={false}
                  />
                ))}
                
                {activeIndicators.rsi && (
                  <Line 
                    type="monotone" 
                    dataKey="rsi" 
                    stroke={getIndicatorColor('rsi')} 
                    yAxisId="price"
                    name="RSI"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Panel>
  );
};

export default PriceChart;