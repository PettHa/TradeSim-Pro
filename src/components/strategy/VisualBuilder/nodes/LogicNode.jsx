import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { ChevronDown } from 'lucide-react';

// Logic node component with in-node editing
const LogicNode = ({ data, selected, id, isConnectable, updateNodeData }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Logic types
  const logicTypes = [
    { value: 'AND', label: 'AND', description: 'Both inputs must be true' },
    { value: 'OR', label: 'OR', description: 'At least one input must be true' },
    { value: 'NOT', label: 'NOT', description: 'Inverts the input value' }
  ];

  // Find current logic type
  const currentLogic = logicTypes.find(l => l.value === (data.logicType || 'AND')) || logicTypes[0];

  // Handle logic type change
  const handleLogicChange = (e) => {
    if (updateNodeData && id) {
      updateNodeData(id, { logicType: e.target.value });
    }
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Determine if single input (NOT) or dual input (AND/OR)
  const isSingleInput = data.logicType === 'NOT';

  return (
    <div className={`strategy-node logic-node ${selected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}>
      {/* Node Header */}
      <div className="node-header" onClick={toggleEdit}>
        <div className="node-title">
          {data.label || currentLogic.value}
        </div>
        <ChevronDown className="edit-toggle-icon" size={14} />
      </div>
      
      {/* Logic Type Selector */}
      {isEditing ? (
        <div className="node-param-group">
          <label className="node-param-label">Logic Type:</label>
          <select
            className="node-select"
            value={data.logicType || 'AND'}
            onChange={handleLogicChange}
          >
            {logicTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="logic-symbol">
          {currentLogic.label}
        </div>
      )}

      {/* Node Connections */}
      <div className="node-connections">
        {/* Input Handles */}
        <div className="connection-inputs">
          {isSingleInput ? (
            <>
              <Handle
                type="target"
                position={Position.Left}
                id="in"
                className="input-handle"
                isConnectable={isConnectable}
              />
              <div className="connection-label">Input</div>
            </>
          ) : (
            <>
              <Handle
                type="target"
                position={Position.Left}
                id="in1"
                className="input-handle input-a"
                style={{ top: '40%' }}
                isConnectable={isConnectable}
              />
              <div className="connection-label">Input A</div>
              
              <Handle
                type="target"
                position={Position.Left}
                id="in2"
                className="input-handle input-b"
                style={{ top: '70%' }}
                isConnectable={isConnectable}
              />
              <div className="connection-label">Input B</div>
            </>
          )}
        </div>
        
        {/* Output Handle */}
        <div className="connection-outputs">
          <Handle
            type="source"
            position={Position.Right}
            id="out"
            className="output-handle"
            isConnectable={isConnectable}
          />
          <div className="connection-label">Result</div>
        </div>
      </div>
    </div>
  );
};

export default LogicNode;