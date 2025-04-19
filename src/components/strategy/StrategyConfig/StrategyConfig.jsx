// --- Fil: src/components/strategy/StrategyConfig/StrategyConfig.jsx ---

// **** NY IMPORT ****
import ReactDOM from 'react-dom'; // Nødvendig for createPortal
import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Plus } from 'lucide-react';
import Panel from '../../common/Panel/Panel';
import IndicatorConfig from '../IndicatorConfig/IndicatorConfig';
import RiskManagement from '../RiskManagement/RiskManagement';
import './StrategyConfig.css';
import { AVAILABLE_INDICATORS } from '../../../constants';

// --- Hjelpefunksjoner (generateIndicatorName, useOutsideAlerter, getDefaultParams, getDefaultCondition) ... (uendret) ---
const generateIndicatorName = (type, existingIndicators) => {
    const currentIndicators = Array.isArray(existingIndicators) ? existingIndicators : [];
    const count = currentIndicators.filter(ind => ind.type === type).length + 1;
    return `${type} #${count}`;
};

function useOutsideAlerter(menuRef, buttonRef, callback) {
    useEffect(() => {
        function handleClickOutside(event) {
            // Sjekk om klikket var utenfor BÅDE meny og knapp
            // Viktig: Selv om menyen er i en portal, refererer menuRef fortsatt til dens React-instans
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                callback();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [menuRef, buttonRef, callback]);
}

const getDefaultParams = (type) => {
    const indicatorDef = AVAILABLE_INDICATORS.find(i => i.type === type);
    const params = {};
    if (indicatorDef?.parameters) {
        indicatorDef.parameters.forEach(p => { params[p.name] = p.default !== undefined ? p.default : ''; });
    } return params;
};

const getDefaultCondition = (type) => {
    const indicatorDef = AVAILABLE_INDICATORS.find(i => i.type === type);
    return indicatorDef?.conditions?.[0]?.id || '';
 };
// --- Slutt Hjelpefunksjoner ---


const StrategyConfig = ({ strategy, onStrategyChange, disabled = false }) => {

    // --- State og Refs ... (uendret) ---
    const [showAddMenu, setShowAddMenu] = useState({ longEntry: false, longExit: false, shortEntry: false, shortExit: false });
    const addMenuRefs = { longEntry: useRef(null), longExit: useRef(null), shortEntry: useRef(null), shortExit: useRef(null) };
    const addBtnRefs = { longEntry: useRef(null), longExit: useRef(null), shortEntry: useRef(null), shortExit: useRef(null) };

    const closeAllMenus = () => {
        setShowAddMenu({ longEntry: false, longExit: false, shortEntry: false, shortExit: false });
    };

    // useOutsideAlerter vil fortsatt fungere, da den sjekker mot referansene
    useOutsideAlerter(addMenuRefs.longEntry, addBtnRefs.longEntry, () => { if(showAddMenu.longEntry) closeAllMenus(); });
    useOutsideAlerter(addMenuRefs.longExit, addBtnRefs.longExit, () => { if(showAddMenu.longExit) closeAllMenus(); });
    useOutsideAlerter(addMenuRefs.shortEntry, addBtnRefs.shortEntry, () => { if(showAddMenu.shortEntry) closeAllMenus(); });
    useOutsideAlerter(addMenuRefs.shortExit, addBtnRefs.shortExit, () => { if(showAddMenu.shortExit) closeAllMenus(); });

    const toggleAddMenu = (category) => {
        const isCurrentlyVisible = showAddMenu[category];
        closeAllMenus();
        if (!isCurrentlyVisible) {
            setShowAddMenu(prev => ({ ...prev, [category]: true }));
        }
     };
    // --- Slutt State og Refs ---


    // --- Andre Handlers (uendret) ---
    const handleNameChange = (e) => { onStrategyChange({ name: e.target.value }); };
    const handleLongEnabledChange = (e) => { onStrategyChange({ longEnabled: e.target.checked }); };
    const handleShortEnabledChange = (e) => { onStrategyChange({ shortEnabled: e.target.checked }); };
    const handleRiskManagementChange = (updatedRiskManagement) => { onStrategyChange(updatedRiskManagement); };
    // --- Slutt Andre Handlers ---


    // --- Indikator Handlers (uendret - bruker fullCategoryKey) ---
    const addIndicator = (category, type) => {
        const fullCategoryKey = category + 'Indicators';
        const currentIndicators = strategy?.[fullCategoryKey] || [];
        const currentIds = currentIndicators.map(i => i.id).filter(id => typeof id === 'number');
        const newId = currentIds.length > 0 ? Math.max(0, ...currentIds) + 1 : 1;
        let newIndicator;
        try {
            newIndicator = { id: newId, type: type, name: generateIndicatorName(type, currentIndicators), ...getDefaultParams(type), condition: getDefaultCondition(type) };
        } catch (error) { console.error("[addIndicator] Error:", error); closeAllMenus(); return; }
        const updatedCategoryArray = [...currentIndicators, newIndicator];
        onStrategyChange({ [fullCategoryKey]: updatedCategoryArray });
        closeAllMenus();
    };
    const updateIndicator = (category, updatedIndicator) => {
        const fullCategoryKey = category + 'Indicators';
        const updatedCategoryArray = (strategy?.[fullCategoryKey] || []).map(ind => ind.id === updatedIndicator.id ? updatedIndicator : ind);
        onStrategyChange({ [fullCategoryKey]: updatedCategoryArray });
    };
    const removeIndicator = (category, id) => {
        const fullCategoryKey = category + 'Indicators';
        const updatedCategoryArray = (strategy?.[fullCategoryKey] || []).filter(ind => ind.id !== id);
        onStrategyChange({ [fullCategoryKey]: updatedCategoryArray });
    };
    // --- Slutt Indikator Handlers ---


    // --- **** START MODIFISERT HJELPEKOMPONENT **** ---
    const AddIndicatorControl = ({ category, buttonClass, buttonRef, menuRef }) => {
        // State for å holde menyens beregnede posisjonsstil
        const [menuStyle, setMenuStyle] = useState({});

        // Effekt for å beregne posisjon når menyen skal vises
        useEffect(() => {
            if (showAddMenu[category] && buttonRef.current) {
                const buttonRect = buttonRef.current.getBoundingClientRect();
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;

                // Beregn posisjon basert på knappens posisjon + scroll
                // Plasser menyen rett under knappen
                setMenuStyle({
                    position: 'absolute', // Absolutt posisjonering i portalens mål (body)
                    top: `${buttonRect.bottom + scrollY + 4}px`, // Nedenfor knappen + scroll + 4px gap
                    left: `${buttonRect.left + scrollX}px`,      // Justert med venstre kant + scroll
                    // zIndex settes av .add-indicator-menu klassen
                });
            }
        }, [showAddMenu, category, buttonRef]); // Kjør på nytt hvis synlighet eller knapp-ref endres

        return (
            // indicator-actions beholder position: relative for eventuell annen intern posisjonering
            <div className="indicator-actions">
                <button
                    type="button"
                    ref={buttonRef} // Koble ref til knappen
                    className={`btn btn-sm ${buttonClass}`}
                    onClick={() => toggleAddMenu(category)}
                    aria-haspopup="true" // Tilgjengelighet
                    aria-expanded={showAddMenu[category]} // Tilgjengelighet
                >
                    <Plus size={14} /> Add Indicator
                </button>

                {/* ---- PORTAL START ---- */}
                {showAddMenu[category] && ReactDOM.createPortal(
                    <div
                        className="add-indicator-menu" // For generell styling
                        ref={menuRef} // Viktig for useOutsideAlerter
                        style={menuStyle} // Dynamisk posisjonering
                        // role="listbox" // Valgfritt for tilgjengelighet
                    >
                        {AVAILABLE_INDICATORS.map(indDef => (
                            <button
                                key={indDef.type}
                                type="button"
                                className="add-indicator-item"
                                onClick={() => addIndicator(category, indDef.type)}
                                // role="option" // Valgfritt for tilgjengelighet
                            >
                                {indDef.name} ({indDef.type})
                            </button>
                        ))}
                    </div>,
                    document.body // Målet for portalen - render utenfor .panel
                )}
                {/* ---- PORTAL END ---- */}
            </div>
        );
    };
    // --- **** SLUTT MODIFISERT HJELPEKOMPONENT **** ---


    // --- Hovedrender (Bruker den modifiserte AddIndicatorControl) ---
    return (
        <fieldset disabled={disabled} className="strategy-config">
           <legend className="sr-only">Strategy Configuration Panel</legend>
            <Panel title="Strategy Configuration">
                <div className="form-group">
                    <label className="form-label" htmlFor="strategyNameInput">Strategy Name</label>
                    <input id="strategyNameInput" type="text" className="form-control" value={strategy?.name || ''} onChange={handleNameChange} placeholder="Enter strategy name" />
                </div>
                {/* Long Position Section */}
                <div className="strategy-position">
                     <div className="strategy-position-header">
                         <label className="form-check"><input id="longEnabledCheckbox" type="checkbox" className="form-check-input" checked={!!strategy?.longEnabled} onChange={handleLongEnabledChange} /><span className="form-check-label" htmlFor="longEnabledCheckbox">Enable Long Positions</span></label>
                         <span className="position-badge position-badge-long" aria-hidden="true"><ArrowUp size={16} className="position-badge-icon" /> Long</span>
                    </div>
                     {strategy?.longEnabled && ( <>
                        <div className="indicator-group long-entry">
                            <h4 className="indicator-group-title">Long Entry Conditions (ALL must be true)</h4>
                            {(strategy?.longEntryIndicators || []).map(indicator => (
                                <IndicatorConfig
                                    key={indicator.id} indicator={indicator}
                                    onChange={(updated) => updateIndicator('longEntry', updated)}
                                    onRemove={() => removeIndicator('longEntry', indicator.id)}
                                />
                            ))}
                            {/* Bruker nå portal-versjonen av kontrollen */}
                            <AddIndicatorControl category="longEntry" buttonClass="btn-success" buttonRef={addBtnRefs.longEntry} menuRef={addMenuRefs.longEntry} />
                        </div>
                        <div className="indicator-group long-exit">
                             <h4 className="indicator-group-title">Long Exit Conditions (ANY can trigger exit)</h4>
                            {(strategy?.longExitIndicators || []).map(indicator => (
                                <IndicatorConfig
                                    key={indicator.id} indicator={indicator}
                                    onChange={(updated) => updateIndicator('longExit', updated)}
                                    onRemove={() => removeIndicator('longExit', indicator.id)}
                                />
                             ))}
                            <AddIndicatorControl category="longExit" buttonClass="btn-danger" buttonRef={addBtnRefs.longExit} menuRef={addMenuRefs.longExit} />
                        </div>
                     </>)}
                </div>
                 {/* Short Position Section */}
                <div className="strategy-position">
                    <div className="strategy-position-header">
                        <label className="form-check"><input id="shortEnabledCheckbox" type="checkbox" className="form-check-input" checked={!!strategy?.shortEnabled} onChange={handleShortEnabledChange} /><span className="form-check-label" htmlFor="shortEnabledCheckbox">Enable Short Positions</span></label>
                        <span className="position-badge position-badge-short" aria-hidden="true"><ArrowDown size={16} className="position-badge-icon" /> Short</span>
                    </div>
                     {strategy?.shortEnabled && ( <>
                         <div className="indicator-group short-entry">
                            <h4 className="indicator-group-title">Short Entry Conditions (ALL must be true)</h4>
                            {(strategy?.shortEntryIndicators || []).map(indicator => (
                                <IndicatorConfig
                                    key={indicator.id} indicator={indicator}
                                    onChange={(updated) => updateIndicator('shortEntry', updated)}
                                    onRemove={() => removeIndicator('shortEntry', indicator.id)}
                                />
                             ))}
                            <AddIndicatorControl category="shortEntry" buttonClass="btn-danger" buttonRef={addBtnRefs.shortEntry} menuRef={addMenuRefs.shortEntry} />
                         </div>
                        <div className="indicator-group short-exit">
                            <h4 className="indicator-group-title">Short Exit Conditions (ANY can trigger exit)</h4>
                           {(strategy?.shortExitIndicators || []).map(indicator => (
                                <IndicatorConfig
                                    key={indicator.id} indicator={indicator}
                                    onChange={(updated) => updateIndicator('shortExit', updated)}
                                    onRemove={() => removeIndicator('shortExit', indicator.id)}
                                />
                            ))}
                           <AddIndicatorControl category="shortExit" buttonClass="btn-success" buttonRef={addBtnRefs.shortExit} menuRef={addMenuRefs.shortExit} />
                        </div>
                    </>)}
                </div>
            </Panel>
            {/* Risk Management Component */}
            <RiskManagement
                stopLoss={strategy?.stopLoss ?? 0}
                takeProfit={strategy?.takeProfit ?? 0}
                initialCapital={strategy?.initialCapital ?? 10000}
                positionSize={strategy?.positionSize ?? 10}
                onChange={handleRiskManagementChange}
            />
        </fieldset>
    );
};

export default StrategyConfig;