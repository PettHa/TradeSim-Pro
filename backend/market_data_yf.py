#!/usr/bin/env python3
"""
Market data service using Yahoo Finance (yfinance)
with local CSV file caching.
Called via command-line arguments. Fetches specific history length based on interval.
Provides enhanced debugging output via print statements.
"""

import os
import time
import sys # For å skrive til stderr
from datetime import datetime, timedelta
import pandas as pd
import yfinance as yf
import argparse
import traceback # For å skrive ut full traceback ved feil

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'market_data')
DEFAULT_FETCH_DAYS_ARG = 365
CACHE_HOURS = 24
DEFAULT_SYMBOLS = [ # Forkortet for eksempel
    {'symbol': 'AAPL', 'name': 'Apple Inc.', 'type': 'stock'},
    {'symbol': 'MSFT', 'name': 'Microsoft Corporation', 'type': 'stock'},
    {'symbol': 'GOOGL', 'name': 'Alphabet Inc. (Class A)', 'type': 'stock'},
    {'symbol': 'AMZN', 'name': 'Amazon.com, Inc.', 'type': 'stock'},
    {'symbol': 'TSLA', 'name': 'Tesla, Inc.', 'type': 'stock'},
    {'symbol': 'NVDA', 'name': 'NVIDIA Corporation', 'type': 'stock'},
    {'symbol': '^GSPC', 'name': 'S&P 500', 'type': 'index'},
    {'symbol': '^DJI', 'name': 'Dow Jones Industrial Average', 'type': 'index'},
    {'symbol': '^IXIC', 'name': 'NASDAQ Composite', 'type': 'index'},
    {'symbol': 'EURUSD=X', 'name': 'EUR/USD', 'type': 'forex'},
    {'symbol': 'GBPUSD=X', 'name': 'GBP/USD', 'type': 'forex'},
    {'symbol': 'JPY=X', 'name': 'USD/JPY', 'type': 'forex'},
]
AVAILABLE_TIMEFRAMES = [
    {'id': '1h', 'name': '1 Hour', 'yf_interval': '1h'},
    # OBS: '4h' er IKKE en standard yfinance interval. Kan gi feil.
    # {'id': '4h', 'name': '4 Hours', 'yf_interval': '4h'}, # Vurder å fjerne eller finne alternativ
    {'id': '1d', 'name': '1 Day', 'yf_interval': '1d'},
    {'id': '1wk', 'name': '1 Week', 'yf_interval': '1wk'},
    {'id': '1mo', 'name': '1 Month', 'yf_interval': '1mo'},
]
# ---------------------

# --- Hjelpefunksjoner ---

def print_debug(message):
    """Helper for DEBUG level prints"""
    print(f"Py DEBUG: {message}", file=sys.stdout) # Skriv til stdout

def print_info(message):
    """Helper for INFO level prints"""
    print(f"Py INFO: {message}", file=sys.stdout)

def print_warning(message):
    """Helper for WARNING level prints"""
    # Skriv advarsler til stderr slik at Node.js kan se dem separat hvis ønskelig
    print(f"Py WARNING: {message}", file=sys.stderr)

def print_error(message, include_traceback=False):
    """Helper for ERROR level prints"""
    print(f"Py ERROR: {message}", file=sys.stderr)
    if include_traceback:
        traceback.print_exc(file=sys.stderr) # Skriv full traceback til stderr

# --- Kjernefunksjoner ---

def is_cached_file_fresh(filepath, hours=CACHE_HOURS):
    """Check if cached file exists and is fresh"""
    if not os.path.exists(filepath):
        print_debug(f"Cache check: File not found - {os.path.basename(filepath)}")
        return False
    try:
        file_mod_time = os.path.getmtime(filepath)
        file_age_seconds = time.time() - file_mod_time
        is_fresh = file_age_seconds < (hours * 3600)
        print_debug(f"Cache check: File '{os.path.basename(filepath)}' age {file_age_seconds:.0f}s. Fresh: {is_fresh} (Threshold: {hours*3600}s)")
        return is_fresh
    except OSError as e:
        print_warning(f"Could not get modification time for {filepath}: {e}")
        return False

def calculate_indicators(df):
    """Calculate SMA20 and RSI14 indicators"""
    print_debug(f"Calculating indicators for DataFrame with shape {df.shape}")
    close_col = 'close'
    if close_col not in df.columns:
        print_error(f"'{close_col}' column not found for indicator calculation.")
        return df

    # Kopier for å unngå SettingWithCopyWarning hvis df er en slice (selv om det kanskje ikke er tilfelle her)
    df_out = df.copy()

    try:
        # Beregn SMA20
        df_out['sma20'] = df_out[close_col].rolling(window=20, min_periods=20).mean()
        print_debug("SMA20 calculated.")

        # Beregn RSI14
        delta = df_out[close_col].diff()
        gain = delta.where(delta > 0, 0.0).rolling(window=14, min_periods=1).mean()
        loss = -delta.where(delta < 0, 0.0).rolling(window=14, min_periods=1).mean()
        # Håndter tilfeller der loss er null for å unngå divisjon med null
        loss = loss.replace(0, 1e-10) # Bruk en veldig liten verdi i stedet for 0
        rs = gain / loss
        df_out['rsi'] = 100.0 - (100.0 / (1.0 + rs))
        # df['rsi'].fillna(50.0, inplace=True) # Gammel metode (kan gi warning)
        df_out['rsi'] = df_out['rsi'].fillna(50.0) # Ny, sikrere metode
        print_debug("RSI14 calculated.")
    except Exception as e:
        print_error(f"Error during indicator calculation: {e}", include_traceback=True)
        # Returner den *originale* df hvis beregning feiler, siden df_out kan være delvis modifisert
        return df

    print_debug(f"Indicators calculation complete. DataFrame shape {df_out.shape}")
    return df_out

def map_timeframe_id_to_yf_interval(timeframe_id):
    """Find the Yahoo Finance interval string"""
    for tf in AVAILABLE_TIMEFRAMES:
        if tf['id'] == timeframe_id or tf['yf_interval'] == timeframe_id:
            print_debug(f"Mapped timeframe ID '{timeframe_id}' to yf_interval '{tf['yf_interval']}'")
            return tf['yf_interval']
    print_warning(f"Timeframe ID '{timeframe_id}' not found in AVAILABLE_TIMEFRAMES. Using default '1d'.")
    return '1d'

def save_default_lists():
    """Saves default symbols and timeframes to CSV"""
    print_info("Checking/Saving default lists...")
    os.makedirs(DATA_DIR, exist_ok=True) # Sørg for at mappen finnes
    symbols_file = os.path.join(DATA_DIR, 'default_symbols.csv')
    timeframes_file = os.path.join(DATA_DIR, 'timeframes.csv')

    if not os.path.exists(symbols_file):
        try:
            pd.DataFrame(DEFAULT_SYMBOLS).to_csv(symbols_file, index=False)
            print_info(f"Saved default symbols to {symbols_file}")
        except Exception as e:
            print_warning(f"Could not save default symbols: {e}")
    else:
        print_debug("Default symbols file already exists.")

    if not os.path.exists(timeframes_file):
        try:
            # Filtrer ut ugyldige timeframes før lagring hvis nødvendig
            valid_timeframes = [tf for tf in AVAILABLE_TIMEFRAMES if tf['yf_interval'] in ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']]
            pd.DataFrame(valid_timeframes).to_csv(timeframes_file, index=False)
            print_info(f"Saved available timeframes to {timeframes_file}")
        except Exception as e:
            print_warning(f"Could not save timeframes: {e}")
    else:
        print_debug("Timeframes file already exists.")

    print_info("Default lists check/save complete.")


# --- Kjernefunksjon for datahenting ---
def fetch_market_data_yf(symbol, timeframe_id='1d', days_arg=DEFAULT_FETCH_DAYS_ARG):
    """Fetch market data based on timeframe, cache, calc indicators."""
    print_info(f"--- Starting fetch_market_data_yf for {symbol} ({timeframe_id}) ---")
    yf_interval = map_timeframe_id_to_yf_interval(timeframe_id)
    safe_symbol = symbol.replace('/','-').replace('=','_') # For filnavn
    cache_file = os.path.join(DATA_DIR, f"{safe_symbol}_{yf_interval}_data.csv")
    print_debug(f"Cache file path: {cache_file}")

    # 1. Check Cache
    if is_cached_file_fresh(cache_file):
        print_info(f"Using fresh cached data for {symbol} ({yf_interval})")
        return cache_file

    # 2. Determine Fetch Period
    end_date = datetime.now()
    start_date = None
    fetch_description = "MAX available"
    # yfinance krever start/slutt for < 1d intervaller, og har begrensninger på hvor langt tilbake
    # Se yfinance dokumentasjon for detaljer om 'period' vs 'start'/'end' og maks rekkevidde per intervall
    if yf_interval == '1h':
        # Max 730 days for 1h interval
        fetch_days = 730
        start_date = end_date - timedelta(days=fetch_days)
        fetch_description = f"{fetch_days} days"
    # FJERNET '4h' da det ikke er standard yf intervall
    # elif yf_interval == '4h':
    #     fetch_days = 730 # Antagelse, MÅ SJEKKES
    #     start_date = end_date - timedelta(days=fetch_days)
    #     fetch_description = f"{fetch_days} days"
    elif yf_interval in ['1d', '5d', '1wk', '1mo', '3mo']:
        # For daily and longer, max history is usually fine
        start_date = None
        fetch_description = "MAX available"
    else: # For andre intervaller (f.eks. minutter), yfinance har kortere maks rekkevidde
        # Eksempel: '1m' data er vanligvis bare tilgjengelig 7 dager tilbake (maks 30 dager med start/slutt)
        if yf_interval in ['1m', '2m', '5m', '15m', '30m', '90m']:
             fetch_days = 60 # Hent maks 60 dager, yf gir data for siste 30 innenfor det
             start_date = end_date - timedelta(days=fetch_days)
             fetch_description = f"up to {fetch_days} days"
        else:
             print_warning(f"Unknown interval '{yf_interval}', attempting MAX history fetch.")
             start_date = None
             fetch_description = "MAX available"

    print_info(f"Fetching {fetch_description} historical data for {symbol} (Interval: {yf_interval})...")
    if start_date: print_debug(f"Calculated fetch range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

    try:
        # 3. Fetch Data
        print_debug(f"Calling yf.download(tickers='{symbol}', start={start_date}, end={end_date}, interval='{yf_interval}')")
        data = yf.download(
            tickers=symbol,
            start=start_date,
            end=end_date,
            interval=yf_interval,
            progress=False,
            auto_adjust=True, # Bruker justerte priser
            # group_by='ticker' # Kan være nyttig hvis du henter flere symboler
        )
        print_debug(f"yf.download finished. DataFrame is empty: {data.empty}")

        if data.empty:
             print_warning(f"No data returned by yfinance for {symbol} (Interval: {yf_interval}).")
             if os.path.exists(cache_file):
                 print_info(f"Keeping potentially stale cache for {symbol}.")
                 return cache_file # Returner gammel cache hvis den finnes
             return None # Ingen data og ingen cache

        print_debug(f"Initial data shape: {data.shape}, Columns: {data.columns.tolist()}, Index name: {data.index.name}")

        # 4. Process Data

        # --- VIKTIG FIX: Håndter MultiIndex Kolonner ---
        if isinstance(data.columns, pd.MultiIndex):
            print_debug("Detected MultiIndex columns. Flattening by keeping first level...")
            # Behold kun det øverste nivået (f.eks. 'Open', 'High', 'Low', 'Close', 'Volume')
            data.columns = data.columns.get_level_values(0)
            print_debug(f"Columns after flattening: {data.columns.tolist()}")
        # --- SLUTT FIX ---

        # Reset index for å få 'Date'/'Datetime' som kolonne
        original_index_name = data.index.name or 'Date' # Gjett 'Date' hvis navnet er None
        data = data.reset_index()
        print_debug(f"Shape after reset_index: {data.shape}, Columns: {data.columns.tolist()}")

        # --- FORBEDRET: Identifiser og Omdøp Kolonner ---
        # Finn datokolonnen (kan hete 'Date' eller 'Datetime' eller navnet fra index)
        date_col_original_name = None
        possible_date_names = [original_index_name, 'Date', 'Datetime']
        for name in possible_date_names:
            if name in data.columns:
                date_col_original_name = name
                break

        if not date_col_original_name:
             print_error(f"Could not identify the date column after reset_index for {symbol}. Columns: {data.columns.tolist()}")
             if os.path.exists(cache_file): return cache_file
             return None
        print_debug(f"Identified original date column as: '{date_col_original_name}'")

        # Definer ønskede kolonner og deres nye navn (nå med enkle strenger)
        rename_map = {
            date_col_original_name: 'date',
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
            # Legg til 'Adj Close' hvis du satte auto_adjust=False
        }

        # Omdøp kun de kolonnene som faktisk finnes
        columns_to_rename = {k: v for k, v in rename_map.items() if k in data.columns}
        data.rename(columns=columns_to_rename, inplace=True)
        print_debug(f"Columns after applying rename map {columns_to_rename}: {data.columns.tolist()}")

        # Sjekk om 'date'-kolonnen faktisk ble opprettet
        if 'date' not in data.columns:
            print_error(f"'date' column missing after rename attempt for {symbol}. Columns: {data.columns.tolist()}")
            if os.path.exists(cache_file): return cache_file
            return None
        # --- SLUTT FORBEDRING ---

        # Konverter 'date'-kolonnen til riktig format
        try:
            print_debug(f"Converting 'date' column to datetime objects...")
            data['date'] = pd.to_datetime(data['date'])
            # Behold som datetime for intradag, konverter til date for daglig+
            is_intraday = yf_interval in ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h']
            if not is_intraday:
                 # For daglig/ukentlig/månedlig, behold kun dato-delen
                 # Viktig: Bruk .dt.normalize() for å sette klokkeslett til 00:00:00
                 #          i stedet for .dt.date som konverterer til Python date objekter
                 data['date'] = data['date'].dt.normalize()
                 print_debug("'date' column normalized to midnight (kept as datetime).")
            else:
                 print_debug("'date' column kept as datetime objects (intraday).")
        except Exception as date_err:
            print_warning(f"Error converting 'date' column for {symbol}: {date_err}")
            # Ikke kritisk feil, fortsett, men dropna/sortering kan feile

        # Legg til symbol-kolonne
        data['symbol'] = symbol

        # Velg ut nødvendige kolonner FØR indikatorberegning for renhet
        required_cols = ['date', 'open', 'high', 'low', 'close', 'volume', 'symbol']
        available_cols = [col for col in required_cols if col in data.columns]
        # Sjekk om essensielle kolonner mangler
        if 'close' not in available_cols or 'date' not in available_cols:
             print_error(f"Essential columns ('date', 'close') missing before indicator calculation. Available: {available_cols}")
             if os.path.exists(cache_file): return cache_file
             return None
        data = data[available_cols]
        print_debug(f"Selected columns: {available_cols}. Shape before indicators: {data.shape}")

        # Beregn indikatorer
        data = calculate_indicators(data)

        # Fjern rader med manglende essensielle verdier (NÅ SKAL 'date' finnes!)
        essential_subset = ['date', 'open', 'high', 'low', 'close', 'volume']
        cols_to_check = [col for col in essential_subset if col in data.columns]
        original_rows = len(data)
        print_debug(f"Shape before dropna (subset={cols_to_check}): {data.shape}")
        data.dropna(subset=cols_to_check, inplace=True) # Bruk 'inplace=True' her er OK
        rows_dropped = original_rows - len(data)
        if rows_dropped > 0: print_info(f"Removed {rows_dropped} rows with missing values in {cols_to_check} for {symbol}.")
        print_debug(f"Shape after dropna: {data.shape}")

        if data.empty:
            print_warning(f"DataFrame became empty after removing NaNs for {symbol}. No data to save.")
            # Slett gammel cache hvis den er utdatert? Eller behold den? For nå, behold.
            if os.path.exists(cache_file): print_info(f"Keeping potentially stale cache for {symbol}.")
            return cache_file if os.path.exists(cache_file) else None


        # Sorter etter dato
        try:
             print_debug("Sorting data by date...")
             data.sort_values(by='date', ascending=True, inplace=True)
             print_debug("Sorting complete.")
        except Exception as sort_err:
            print_warning(f"Could not sort data by date for {symbol}: {sort_err}")

        # 5. Save to Cache
        os.makedirs(DATA_DIR, exist_ok=True)
        try:
            # Bruk ISO 8601 format for datetime, standard YYYY-MM-DD for date
            # Pandas' to_csv håndterer dette bra automatisk basert på dtype
            print_info(f"Saving data ({len(data)} rows) for {symbol} ({yf_interval}) to {cache_file}")
            data.to_csv(cache_file, index=False) # La pandas håndtere datoformat
            print_info(f"Save successful for {symbol} ({yf_interval}).")
            return cache_file
        except Exception as e:
            print_error(f"Error saving data to cache file {cache_file}: {e}", include_traceback=True)
            # Returner ingenting hvis lagring feiler, selv om data ble hentet
            return None

    except Exception as e:
        # Generell feilhåndtering for hele fetch/process-blokken
        print_error(f"Unhandled error during fetch/process for {symbol}: {e}", include_traceback=True)
        if os.path.exists(cache_file):
             print_info(f"Keeping potentially stale cache for {symbol} due to unhandled error.")
             return cache_file # Returner gammel cache hvis feil oppstod
        return None # Ingen cache og feil oppstod
    finally:
        print_info(f"--- Finished fetch_market_data_yf for {symbol} ({timeframe_id}) ---")


# --- Hovedlogikk for å håndtere argumenter ---
if __name__ == "__main__":
    print_info("Python script started.")
    # Definer argument parser
    parser = argparse.ArgumentParser(
        description="Fetch Yahoo Finance market data and cache it.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter # Viser standardverdier i hjelp
        )
    parser.add_argument('--symbol', type=str, required=False, help='Trading symbol (e.g., AAPL)')
    parser.add_argument('--timeframe', type=str, default='1d', help='Timeframe ID (e.g., 1h, 1d, 1wk, 1mo)')
    # Dager brukes nå kun av kallende skript for å begrense resultatet, ikke for fetch-periode
    parser.add_argument('--days', type=int, default=DEFAULT_FETCH_DAYS_ARG, help='Number of past periods (used by caller to limit result, fetch duration determined by timeframe)')
    parser.add_argument('--init-lists', action='store_true', help='Initialize default symbol/timeframe lists and exit if no symbol provided.')

    # Parse argumenter
    try:
        args = parser.parse_args()
        print_debug(f"Parsed arguments: {args}")
    except Exception as parse_err:
        print_error(f"Error parsing arguments: {parse_err}")
        exit(2) # Avslutt med feilkode for argumentfeil

    # Kjør --init-lists hvis bedt om
    if args.init_lists:
        print_info("Processing --init-lists request.")
        try:
            save_default_lists()
            print_info("--init-lists processing complete.")
        except Exception as init_err:
            print_error(f"Error during --init-lists processing: {init_err}", include_traceback=True)
            # Kritisk feil hvis *kun* init feilet
            if not args.symbol:
                exit(1)

        # Hvis *kun* init var ønsket (ingen symbol gitt), avslutt nå
        if not args.symbol:
             print_info("Exiting after --init-lists.")
             exit(0)
        # Ellers fortsett for å hente data for gitt symbol

    # Sjekk om symbol er påkrevd hvis vi kom hit (dvs. ikke bare init)
    if not args.symbol:
        print_error("Argument --symbol is required when not using --init-lists exclusively.")
        parser.print_usage(file=sys.stderr) # Skriv bruk til stderr
        exit(2) # Avslutt med feilkode for manglende argument

    # Kjør hovedfunksjonen for datahenting
    print_info(f"Processing request for Symbol: {args.symbol}, Timeframe: {args.timeframe}...")
    cache_filepath = None # Initialiser
    try:
        cache_filepath = fetch_market_data_yf(args.symbol, args.timeframe, args.days)
    except Exception as fetch_err:
        # Fang uventede feil i selve kall til fetch_market_data_yf (bør ikke skje pga try/except inni)
        print_error(f"Unexpected top-level error calling fetch_market_data_yf for {args.symbol}: {fetch_err}", include_traceback=True)
        cache_filepath = None

    # Rapporter resultat og avslutt
    if cache_filepath and os.path.exists(cache_filepath):
        print_info(f"Process complete. Data file available/updated at: {cache_filepath}")
        exit(0) # Suksess
    else:
        print_error(f"Process failed for {args.symbol}. No valid data file produced or saved.")
        exit(1) # Feil