import React from 'react';
import { Handle, Position } from 'reactflow';

const nodeStyle = {
    border: '1px solid #dc3545',
    padding: '10px 15px',
    borderRadius: '5px',
    background: '#f8d7da',
    color: '#721c24',
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: '120px'
};

function ActionNode({ data }) {
  // data.actionType vil være f.eks. 'Enter Long', 'Exit Short'
  return (
    <div style={nodeStyle}>
      {/* Én inngang for å trigge handlingen */}
      <Handle type="target" position={Position.Left} id="trigger-in" style={{ background: '#555' }} />
      {data.actionType || 'Action'}
    </div>
  );
}

export default ActionNode;