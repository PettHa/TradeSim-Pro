import React, { useState, useEffect, useRef } from 'react';
// Sikre at alle importerte ikoner faktisk brukes
import { Settings, HelpCircle, Search, Loader } from 'lucide-react';
import { fetchAvailableSymbols } from '../../services/marketData';
import './Header.css'; // Stiler håndteres i CSS-filen

const Header = ({ selectedSymbol = 'AAPL', onSymbolChange }) => {
    // State hooks
    const [showSymbolSearch, setShowSymbolSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableSymbols, setAvailableSymbols] = useState([]);
    const [isLoadingSymbols, setIsLoadingSymbols] = useState(true);
    const [symbolError, setSymbolError] = useState('');

    // Ref hooks for å håndtere klikk utenfor
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    // Effekt for å hente symboler ved første lasting
    useEffect(() => {
        const loadSymbols = async () => {
            setIsLoadingSymbols(true);
            setSymbolError(''); // Nullstill tidligere feil
            try {
                const symbols = await fetchAvailableSymbols();
                setAvailableSymbols(symbols);
            } catch (error) {
                // Logg den spesifikke feilmeldingen
                console.error('Error loading symbols:', error);
                // Vis en brukervennlig feilmelding
                setSymbolError(error.message || 'Failed to load symbols. Check API.');
                setAvailableSymbols([]); // Nullstill symboler ved feil
            } finally {
                setIsLoadingSymbols(false);
            }
        };
        loadSymbols();
    }, []); // Tom dependency array betyr kjør kun én gang når komponenten monteres

    // Effekt for å håndtere klikk utenfor nedtrekksmenyen for å lukke den
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Sjekk om klikket skjedde utenfor både knappen og nedtrekksmenyen
            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowSymbolSearch(false); // Lukk menyen
            }
        };

        // Legg til lytteren kun når menyen er åpen
        if (showSymbolSearch) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            // Fjern lytteren når menyen lukkes for å unngå unødvendig lytting
            document.removeEventListener('mousedown', handleClickOutside);
        }

        // Oppryddingsfunksjon som kjøres når komponenten avmonteres eller showSymbolSearch endres
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSymbolSearch]); // Kjør denne effekten på nytt hver gang showSymbolSearch endres

    // Håndterer klikk på et symbol i listen
    const handleSymbolClick = (symbolCode) => {
        if (onSymbolChange) {
            onSymbolChange(symbolCode); // Kall callback-funksjonen fra App.js
        }
        setShowSymbolSearch(false); // Lukk menyen
        setSearchTerm(''); // Nullstill søketermen
    };

    // Filtrerer symbollisten basert på søketermen
    const filteredSymbols = availableSymbols.filter(s => {
        // Håndter potensielle null/undefined-verdier for sikkerhets skyld
        const symbolCode = s.symbol || '';
        const symbolName = s.name || '';
        const term = searchTerm.toLowerCase().trim();

        if (!term) return true; // Vis alle hvis søket er tomt

        // Sjekk om søketermen finnes i symbolkoden eller navnet
        return symbolCode.toLowerCase().includes(term) ||
               symbolName.toLowerCase().includes(term);
    });

    // --- Render Logikk ---
    return (
        <header className="header">
            <div className="container">
                <div className="header-content">

                    {/* Merkevare/Logo */}
                    <div className="header-brand">
                        <h1 className="header-logo">TradeSim Pro</h1>
                        <p className="header-tagline">Trading Strategi Backtester</p>
                    </div>

                    {/* Symbolvelger */}
                    <div className="symbol-selector">
                        {/* Knapp for å åpne/lukke velgeren */}
                        <div
                            ref={buttonRef} // Koble ref til knappen
                            className="selected-symbol"
                            onClick={() => setShowSymbolSearch(prev => !prev)} // Sikker måte å veksle state
                            role="button" // Semantisk rolle
                            aria-haspopup="listbox" // Indikerer at knappen åpner en liste
                            aria-expanded={showSymbolSearch} // Indikerer om listen er åpen/lukket
                            tabIndex={0} // Gjør knappen fokuserbar med tastatur
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowSymbolSearch(prev => !prev)} // Åpne/lukke med Enter/Space
                        >
                            <span className="symbol-text">{selectedSymbol}</span>
                            {/* Pilindikator */}
                            <span className="symbol-arrow" aria-hidden="true">
                                {showSymbolSearch ? '▲' : '▼'}
                            </span>
                        </div>

                        {/* Nedtrekksmeny - Vises kun når showSymbolSearch er true */}
                        {showSymbolSearch && (
                            <div ref={dropdownRef} className="symbol-dropdown">
                                {/* Søkefelt */}
                                <div className="symbol-search">
                                    <Search size={16} className="search-icon" aria-hidden="true" />
                                    <input
                                        type="text"
                                        placeholder="Søk etter symbol..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        aria-label="Søk etter symboler" // Bedre tilgjengelighet
                                        autoFocus // Sett fokus automatisk når den vises
                                    />
                                </div>

                                {/* Symbolliste */}
                                <div className="symbol-list" role="listbox" aria-label="Tilgjengelige symboler">
                                    {/* Viser lasteindikator */}
                                    {isLoadingSymbols ? (
                                        <div className="symbol-loading no-symbols">
                                            <Loader size={18} className="loading-spinner-inline" />
                                            Laster symboler...
                                        </div>
                                    /* Viser feilmelding */
                                    ) : symbolError ? (
                                        <div className="symbol-error no-symbols" role="alert">
                                            {symbolError}
                                        </div>
                                    /* Viser listen hvis den ikke er tom */
                                    ) : filteredSymbols.length > 0 ? (
                                        filteredSymbols.map((symbol) => (
                                            <div
                                                key={symbol.symbol} // Viktig og unik key for hver rad
                                                className="symbol-item"
                                                onClick={() => handleSymbolClick(symbol.symbol)}
                                                role="option" // Semantisk rolle for listeelement
                                                aria-selected={symbol.symbol === selectedSymbol} // Indikerer valgt element
                                                tabIndex={-1} // Elementer i listen bør ikke være direkte tabbare
                                            >
                                                <div className="symbol-code">{symbol.symbol}</div>
                                                <div className="symbol-name">{symbol.name}</div>
                                                {/* Bruk fallback hvis 'type' mangler */}
                                                <div className="symbol-type">{symbol.type || 'N/A'}</div>
                                            </div>
                                        ))
                                    /* Viser melding hvis listen er tom */
                                    ) : (
                                        <div className="no-symbols">
                                            Ingen symboler funnet{searchTerm ? ` for "${searchTerm}"` : ''}
                                        </div>
                                    )}
                                </div> {/* Slutt symbol-list */}
                            </div> // Slutt symbol-dropdown
                        )} {/* Slutt conditional rendering */}
                    </div>
                    {/* --- Slutt Symbolvelger --- */}

                    {/* Handlingsknapper i Header */}
                    <div className="header-actions">
                        <button className="header-action-btn" title="Innstillinger" aria-label="Innstillinger">
                            <Settings size={20} />
                        </button>
                        <button className="header-action-btn" title="Hjelp" aria-label="Hjelp">
                            <HelpCircle size={20} />
                        </button>
                    </div>

                </div> {/* Slutt header-content */}
            </div> {/* Slutt container */}
        </header> // Slutt header
    ); // Slutt return
}; // Slutt Header-komponent

export default Header;