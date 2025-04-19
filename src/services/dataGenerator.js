/**
 * Data generator service for creating mock market data when API is unavailable
 */

/**
 * Generate sample market data
 * 
 * @param {number} days - Number of days to generate
 * @param {string} symbol - Trading symbol
 * @returns {Array} - Array of price data objects
 */
export const generateSampleData = (days = 100, symbol = 'DEMO') => {
    const data = [];
    const today = new Date();
    let basePrice = getBasePrice(symbol);
    
    // Generate data starting from 'days' ago up to today
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Add some randomness to price movement
      const changePercent = (Math.random() - 0.5) * 2; // -1% to +1%
      basePrice = basePrice * (1 + changePercent / 100);
      
      // Daily price volatility
      const open = basePrice * (1 + (Math.random() - 0.5) / 50);
      const high = Math.max(open * (1 + Math.random() / 25), open);
      const low = Math.min(open * (1 - Math.random() / 25), open);
      const close = (open + high + low + basePrice) / 4; // Weighted towards base price
      
      // For demo consistency, make price and close the same
      const price = close;
      
      // Generate realistic volume
      const volume = Math.floor(getBaseVolume(symbol) * (0.5 + Math.random()));
      
      // Calculate some indicators
      let sma20 = null;
      let rsi = null;
      
      // Only calculate SMA after we have enough data points
      if (i <= days - 20) {
        const priceSlice = data.slice(data.length - 19).map(d => d.price);
        priceSlice.push(price);
        sma20 = priceSlice.reduce((sum, p) => sum + p, 0) / 20;
      }
      
      // Generate RSI (simplified random value between 30-70 with some trend following)
      if (data.length > 0) {
        const prevRSI = data[data.length - 1].rsi;
        if (prevRSI !== null) {
          // RSI tends to revert to mean (50) with some randomness
          rsi = prevRSI + (50 - prevRSI) * 0.1 + (Math.random() - 0.5) * 10;
          rsi = Math.min(Math.max(rsi, 10), 90); // Clamp between 10 and 90
        } else {
          rsi = 40 + Math.random() * 20; // Initial RSI between 40-60
        }
      } else {
        rsi = 40 + Math.random() * 20; // Initial RSI between 40-60
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        symbol,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        price: parseFloat(price.toFixed(2)),
        volume,
        sma20: sma20 !== null ? parseFloat(sma20.toFixed(2)) : null,
        rsi: rsi !== null ? parseFloat(rsi.toFixed(2)) : null
      });
    }
    
    return data;
  };
  
  /**
   * Generate list of available symbols
   * 
   * @returns {Array} - List of trading instruments
   */
  export const generateAvailableSymbols = () => {
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'stock' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock' },
      { symbol: 'META', name: 'Meta Platforms, Inc.', type: 'stock' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock' },
      { symbol: 'NFLX', name: 'Netflix, Inc.', type: 'stock' },
      { symbol: 'DIS', name: 'The Walt Disney Company', type: 'stock' },
      
      { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', type: 'crypto' },
      { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', type: 'crypto' },
      { symbol: 'XRPUSD', name: 'Ripple / US Dollar', type: 'crypto' },
      
      { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex' },
      { symbol: 'GBPUSD', name: 'British Pound / US Dollar', type: 'forex' },
      { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', type: 'forex' },
    ];
  };
  
  /**
   * Get base price for a symbol
   * @private
   */
  function getBasePrice(symbol) {
    const priceMap = {
      'AAPL': 180,
      'MSFT': 350,
      'GOOGL': 130,
      'AMZN': 120,
      'TSLA': 250,
      'META': 200,
      'NVDA': 450,
      'JPM': 140,
      'NFLX': 380,
      'DIS': 95,
      'BTCUSD': 28000,
      'ETHUSD': 1800,
      'XRPUSD': 0.5,
      'EURUSD': 1.1,
      'GBPUSD': 1.3,
      'USDJPY': 150,
      'DEMO': 100
    };
    
    return priceMap[symbol] || 100 + Math.random() * 100;
  }
  
  /**
   * Get base volume for a symbol
   * @private
   */
  function getBaseVolume(symbol) {
    const volumeMap = {
      'AAPL': 80000000,
      'MSFT': 25000000,
      'GOOGL': 15000000,
      'AMZN': 30000000,
      'TSLA': 100000000,
      'META': 20000000,
      'NVDA': 40000000,
      'JPM': 10000000,
      'NFLX': 8000000,
      'DIS': 12000000,
      'BTCUSD': 25000,
      'ETHUSD': 15000,
      'XRPUSD': 5000000,
      'EURUSD': 120000,
      'GBPUSD': 80000,
      'USDJPY': 95000,
      'DEMO': 50000
    };
    
    return volumeMap[symbol] || 20000000;
  }