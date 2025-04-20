import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';

// Action node component with in-node editing
const ActionNode = ({ data, selected, id, isConnectable, updateNodeData }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Action types
  const actionTypes = [
    { value: 'ENTRY', label: 'Entry', description: 'Enter a position' },
    { value: 'EXIT', label: 'Exit', description: 'Exit a position' }
  ];

  // Position types
  const positionTypes = [
    { value: 'LONG', label: 'Long', description: 'Long position (buy)' },
    { value: 'SHORT', label: 'Short', description: 'Short position (sell)' }
  ];

  // Find current action & position types
  const currentAction = actionTypes.find(a => a.value === (data.actionType || 'ENTRY')) || actionTypes[0];
  const currentPosition = positionTypes.find(p => p.value === (data.positionType || 'LONG')) || positionTypes[0];

  // Handle form changes
  const handleActionChange = (e) => {
    if (updateNodeData && id) {
      updateNodeData(id, { actionType: e.target.value });
    }
  };

  const handlePositionChange = (e) => {
    if (updateNodeData && id) {
      updateNodeData(id, { positionType: e.target.value });
    }
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Determine if this is a long or short action
  const isLong = data.positionType === 'LONG';
  // Determine if this is an entry or exit
  const isEntry = data.actionType === 'ENTRY';

  // Get icon based on position type
  const getPositionIcon = () => {
    return isLong ? 
      <ArrowUp size={18} className="position-icon long" /> : 
      <ArrowDown size={18} className="position-icon short" />;
  };

  return (
    <div className={`strategy-node action-node ${selected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${isLong ? 'long' : 'short'} ${isEntry ? 'entry' : 'exit'}`}>
      {/* Node Header */}
      <div className="node-header" onClick={toggleEdit}>
        <div className="node-title">
          {data.label || `${isEntry ? 'Enter' : 'Exit'} ${isLong ? 'Long' : 'Short'}`}
        </div>
        <ChevronDown className="edit-toggle-icon" size={14} />
      </div>
      
      {isEditing ? (
        <>
          {/* Action Type Selector */}
          <div className="node-param-group">
            <label className="node-param-label">Action:</label>
            <select
              className="node-select"
              value={data.actionType || 'ENTRY'}
              onChange={handleActionChange}
            >
              {actionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Position Type Selector */}
          <div className="node-param-group">
            <label className="node-param-label">Position:</label>
            <select
              className="node-select"
              value={data.positionType || 'LONG'}
              onChange={handlePositionChange}
            >
              {positionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <div className="action-details">
          {getPositionIcon()}
          <div className="action-label">
            {currentAction.label} {currentPosition.label}
          </div>
        </div>
      )}
      
      {/* Input Handle for Trigger */}
      <div className="node-connections">
        <div className="connection-inputs">
          <Handle
            type="target"
            position={Position.Left}
            id="trigger"
            className="input-handle"
            isConnectable={isConnectable}
          />
          <div className="connection-label">Trigger</div>
        </div>
      </div>
    </div>
  );
};

export default ActionNode;