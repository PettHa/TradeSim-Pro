// --- Fil: src/components/strategy/IndicatorConfig/IndicatorConfig.jsx ---

import React from 'react';
import './IndicatorConfig.css';
// Hent definisjoner for å få parameter-labels og condition-navn
import { AVAILABLE_INDICATORS } from '../../../constants';

const IndicatorConfig = ({ indicator, onChange, onRemove }) => {

  // Finn parameterdefinisjon for label, min, max, step etc.
  const getParamDef = (paramName) => {
      const indicatorDef = AVAILABLE_INDICATORS.find(i => i.type === indicator.type);
      return indicatorDef?.parameters.find(p => p.name === paramName);
  };

  const handleChange = (field, value) => {
    // Sørg for at numeriske verdier forblir tall og respekterer min/max
    const paramDef = getParamDef(field);
    let processedValue = value;

    if (paramDef?.type === 'number') {
        let numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
            numericValue = paramDef.default !== undefined ? paramDef.default : 0; // Fallback to default or 0
        }
        // Clamp value within min/max if defined
        if (paramDef.min !== undefined) numericValue = Math.max(paramDef.min, numericValue);
        if (paramDef.max !== undefined) numericValue = Math.min(paramDef.max, numericValue);
        processedValue = numericValue;
    }


    onChange({
      ...indicator,
      [field]: processedValue // Use the processed value
    });
  };

  // --- RENDER FUNCTIONS ---

  const renderIndicatorFields = () => {
    // Hjelpefunksjon for å rendre en parameter input
    const renderParamInput = (paramName) => {
       const paramDef = getParamDef(paramName);
       if (!paramDef) return null; // Skip if param definition not found

       const label = paramDef.label || paramName.charAt(0).toUpperCase() + paramName.slice(1).replace(/([A-Z])/g, ' $1'); // Generate label
       const value = indicator[paramName] !== undefined ? indicator[paramName] : paramDef.default;
       const inputType = paramDef.type === 'number' ? 'number' : 'text'; // Default to text if not number

       return (
           <div className="indicator-param" key={paramName}>
                <label className="indicator-param-label" htmlFor={`${indicator.type}_${indicator.id}_${paramName}`}>
                    {label}:
                </label>
                <input
                    id={`${indicator.type}_${indicator.id}_${paramName}`}
                    type={inputType}
                    className="form-control form-control-sm"
                    value={value}
                    onChange={(e) => handleChange(paramName, e.target.value)}
                    step={paramDef.step || (inputType === 'number' ? 1 : undefined)}
                    min={paramDef.min}
                    max={paramDef.max}
                    // Add required if necessary based on paramDef?
                />
            </div>
       );
    };

    const indicatorDef = AVAILABLE_INDICATORS.find(i => i.type === indicator.type);
    if (!indicatorDef) return <p>Unknown indicator type: {indicator.type}</p>;

    // Render all parameters defined in constants
    return indicatorDef.parameters.map(param => renderParamInput(param.name));
  };

  const renderConditionOptions = () => {
    const indicatorDefinition = AVAILABLE_INDICATORS.find(i => i.type === indicator.type);
    if (!indicatorDefinition?.conditions) return null;

    return indicatorDefinition.conditions.map(cond => (
        <option key={cond.id} value={cond.id}>{cond.name}</option>
    ));
  };

  // --- COMPONENT RENDER ---

  return (
    <div className="indicator-config">
      <div className="indicator-header">
        <div className="indicator-name">
          <span className="indicator-badge">{indicator.type}</span>
          {/* Optional: Input for user-defined name (can be removed if not needed) */}
          {/* <input
            type="text"
            className="form-control form-control-sm indicator-name-input"
            placeholder="Optional Name" // Add placeholder
            value={indicator.name || ''} // Handle potentially undefined name
            onChange={(e) => handleChange('name', e.target.value)}
          /> */}
        </div>
        <button
          className="indicator-remove-btn"
          onClick={onRemove}
          title={`Remove ${indicator.type} indicator`}
          aria-label={`Remove ${indicator.type} indicator`}
        >
          × {/* HTML entity for multiplication sign (X) */}
        </button>
      </div>

      <div className="indicator-body">
        {renderIndicatorFields()}

        {/* Condition Selector */}
        <div className="indicator-param">
          <label className="indicator-param-label" htmlFor={`${indicator.type}_${indicator.id}_condition`}>Condition:</label>
          <select
            id={`${indicator.type}_${indicator.id}_condition`}
            className="form-control form-control-sm"
            value={indicator.condition}
            onChange={(e) => handleChange('condition', e.target.value)}
          >
            {renderConditionOptions()}
          </select>
        </div>
      </div>
    </div>
  );
};

export default IndicatorConfig;