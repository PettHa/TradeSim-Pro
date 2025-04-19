# TradeSim Pro

A comprehensive trading strategy backtesting platform built with React and Node.js.

## Features

- **Advanced Strategy Configuration**:
  - Support for both long and short positions
  - Multiple technical indicators (SMA, RSI, MACD)
  - Customizable entry and exit conditions

- **Risk Management Tools**:
  - Stop-loss and take-profit settings
  - Position sizing options
  - Initial capital configuration

- **Interactive Visualization**:
  - Price charts with indicator overlays
  - Equity curve visualization
  - Trade execution markers

- **Performance Metrics**:
  - Win rate and profit factor
  - Maximum drawdown analysis
  - Detailed trade history

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/tradesim-pro.git
   cd tradesim-pro
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Configure your trading strategy:
   - Select indicators and set parameters
   - Define entry and exit conditions
   - Set risk management rules

2. Run the backtest:
   - Click "Run Backtest" to simulate your strategy
   - View performance metrics and trade history
   - Adjust strategy parameters as needed

## Project Structure

```
tradesim-pro/
├── src/
│   ├── components/   # UI components
│   ├── services/     # Backend services
│   ├── utils/        # Helper functions
│   └── hooks/        # Custom React hooks
```

## License

MIT

## Acknowledgements

- [Recharts](https://recharts.org/) for chart visualization
- [TechnicalIndicators](https://github.com/anandanand84/technicalindicators) for indicator calculations