import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { ChevronDown } from 'lucide-react';

// Condition node component with in-node editing
const ConditionNode = ({ data, selected, id, isConnectable, updateNodeData }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Define available condition types
  const conditionTypes = [
    { value: 'GT', label: '>', description: 'Greater Than' },
    { value: 'LT', label: '<', description: 'Less Than' },
    { value: 'EQ', label: '=', description: 'Equals' },
    { value: 'CROSS_ABOVE', label: '↗', description: 'Crosses Above' },
    { value: 'CROSS_BELOW', label: '↘', description: 'Crosses Below' }
  ];
  
  // Get current condition info
  const currentCondition = conditionTypes.find(c => c.value === (data.conditionType || 'GT')) || conditionTypes[0];
  
  // Determine if this condition uses a threshold
  const usesThreshold = data.threshold !== undefined && data.threshold !== null;
  
  // Handle condition type change
  const handleConditionChange = (e) => {
    if (updateNodeData) {
      updateNodeData(id, { conditionType: e.target.value });
    }
  };
  
  // Handle threshold change
  const handleThresholdChange = (e) => {
    if (updateNodeData) {
      updateNodeData(id, { threshold: parseFloat(e.target.value) });
    }
  };
  
  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className={`strategy-node condition-node ${selected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}>
      {/* Node Header */}
      <div className="node-header" onClick={toggleEdit}>
        <div className="node-title">
          {data.label || currentCondition.description}
        </div>
        <ChevronDown className="edit-toggle-icon" size={14} />
      </div>
      
      {/* Main Condition Operator Display */}
      <div className="condition-operator">
        {isEditing ? (
          <select 
            value={data.conditionType || 'GT'} 
            onChange={handleConditionChange}
            className="node-select"
          >
            {conditionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </select>
        ) : (
          <div className="condition-symbol" title={currentCondition.description}>
            {currentCondition.label}
          </div>
        )}
      </div>
      
      {/* Threshold Input (if needed) */}
      {isEditing && (
        <div className="node-param-group">
          <label className="node-param-label">Threshold:</label>
          <input
            type="number"
            className="node-input"
            value={data.threshold || 0}
            onChange={handleThresholdChange}
            step="any"
          />
        </div>
      )}
      
      {/* Connection Labels for Input/Output */}
      <div className="node-connections">
        <div className="connection-labels connection-inputs">
          <div className="connection-label">Value A</div>
          {!usesThreshold && <div className="connection-label">Value B</div>}
        </div>
        
        <div className="connection-labels connection-outputs">
          <div className="connection-label">Result</div>
        </div>
      </div>
      
      {/* Input/Output Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        className="input-handle input-a"
        isConnectable={isConnectable}
      />
      
      {!usesThreshold && (
        <Handle
          type="target"
          position={Position.Left}
          id="b"
          className="input-handle input-b"
          isConnectable={isConnectable}
        />
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        id="result"
        className="output-handle"
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default ConditionNode;