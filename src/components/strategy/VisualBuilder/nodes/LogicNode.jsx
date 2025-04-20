import React from 'react';
import { Handle, Position } from 'reactflow';

const nodeStyle = {
    border: '1px solid #007bff',
    padding: '10px',
    borderRadius: '50%', // Sirkelform
    background: '#e7f3ff',
    width: '60px',
    height: '60px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#0056b3'
};

function LogicNode({ data }) {
  // data.logicType vil være 'AND' eller 'OR'
  return (
    <div style={nodeStyle}>
      {/* Flere inngangshåndtak */}
      <Handle type="target" position={Position.Left} id="in-a" style={{ top: '30%', background: '#555' }} />
      <Handle type="target" position={Position.Left} id="in-b" style={{ top: '70%', background: '#555' }} />
      {/* TODO: Legg til flere innganger dynamisk? */}

      {data.logicType || 'Logic'}

      {/* Én utgang */}
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#555' }} />
    </div>
  );
}

export default LogicNode;