import React from 'react';
import { Handle, Position } from 'reactflow';

const nodeStyle = {
    border: '1px solid #28a745',
    padding: '8px 12px',
    borderRadius: '3px',
    background: '#e9f7ec',
    fontSize: '12px',
    color: '#1d7b37',
    textAlign: 'center',
};

function ConditionNode({ data }) {
  // data.conditionLabel vil være f.eks. '>', '<', 'Crosses Above'
  return (
    <div style={nodeStyle}>
       {/* To innganger for sammenligning */}
       <Handle type="target" position={Position.Left} id="val-a" style={{ top: '30%', background: '#555' }} />
       <Handle type="target" position={Position.Left} id="val-b" style={{ top: '70%', background: '#555' }} />

       {data.conditionLabel || 'Condition'}

       {/* Én utgang (True/False) */}
       <Handle type="source" position={Position.Right} id="out" style={{ background: '#555' }} />
    </div>
  );
}

export default ConditionNode;