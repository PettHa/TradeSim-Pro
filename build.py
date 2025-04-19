import os

def create_directory_structure():
    # Vi er allerede i tradesim-pro mappen, så vi bruker tom streng som base
    main_dir = ""
    
    # Definer alle mapper som skal opprettes
    directories = [
        "public",
        "src",
        "src/assets",
        "src/components",
        "src/components/common",
        "src/components/common/Panel",
        "src/components/common/Button",
        "src/components/strategy",
        "src/components/strategy/StrategyConfig",
        "src/components/strategy/IndicatorConfig",
        "src/components/strategy/RiskManagement",
        "src/components/chart",
        "src/components/chart/PriceChart",
        "src/components/chart/EquityChart",
        "src/components/results",
        "src/components/results/BacktestResults",
        "src/components/results/TradeHistory",
        "src/layout",
        "src/layout/Header",
        "src/layout/Footer",
        "src/services",
        "src/utils",
        "src/hooks",
        "src/constants",
    ]
    
    # Definer alle filer som skal opprettes
    files = [
        "README.md",
        "package.json",
        ".gitignore",
        "public/index.html",
        "public/favicon.ico",
        "public/manifest.json",
        "src/index.js",
        "src/App.js",
        "src/App.css",
        "src/assets/logo.svg",
        "src/components/common/Panel/Panel.jsx",
        "src/components/common/Panel/Panel.css",
        "src/components/common/Button/Button.jsx",
        "src/components/common/Button/Button.css",
        "src/components/strategy/StrategyConfig/StrategyConfig.jsx",
        "src/components/strategy/StrategyConfig/StrategyConfig.css",
        "src/components/strategy/IndicatorConfig/IndicatorConfig.jsx",
        "src/components/strategy/IndicatorConfig/IndicatorConfig.css",
        "src/components/strategy/RiskManagement/RiskManagement.jsx",
        "src/components/strategy/RiskManagement/RiskManagement.css",
        "src/components/chart/PriceChart/PriceChart.jsx",
        "src/components/chart/PriceChart/PriceChart.css",
        "src/components/chart/EquityChart/EquityChart.jsx",
        "src/components/chart/EquityChart/EquityChart.css",
        "src/components/results/BacktestResults/BacktestResults.jsx",
        "src/components/results/BacktestResults/BacktestResults.css",
        "src/components/results/TradeHistory/TradeHistory.jsx",
        "src/components/results/TradeHistory/TradeHistory.css",
        "src/layout/Header/Header.jsx",
        "src/layout/Header/Header.css",
        "src/layout/Footer/Footer.jsx",
        "src/layout/Footer/Footer.css",
        "src/services/backtester.js",
        "src/services/dataGenerator.js",
        "src/utils/indicators.js",
        "src/utils/formatters.js",
        "src/hooks/useBacktest.js",
        "src/constants/index.js",
    ]
    
    # Opprett mapper
    for directory in directories:
        if directory:  # Sjekk om mappen ikke er tom streng
            os.makedirs(directory, exist_ok=True)
            print(f"Opprettet mappe: {directory}")
    
    # Opprett tomme filer
    for file in files:
        with open(file, 'w') as f:
            pass  # Oppretter en tom fil
        print(f"Opprettet fil: {file}")
    
    print("Filstrukturen er ferdig opprettet!")

if __name__ == "__main__":
    create_directory_structure()