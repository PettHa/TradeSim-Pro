import React from 'react';
import { Handle, Position } from 'reactflow';

// Enkel stil for noden
const nodeStyle = {
    border: '1px solid #777',
    padding: '10px 15px',
    borderRadius: '5px',
    background: '#eee',
    minWidth: '150px',
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '12px',
    color: '#555',
};

const typeStyle = {
    fontSize: '10px',
    color: '#888',
};

function IndicatorNode({ data }) {
  // 'data' prop vil inneholde info sendt til noden, f.eks. { label: 'SMA (20)' }

  return (
    <div style={nodeStyle}>
      {/* Inngangshåndtak (f.eks., for prisdata) - Kan fjernes hvis ikke nødvendig */}
      {/* <Handle type="target" position={Position.Left} id="price-in" style={{ top: '50%' }} /> */}

      <label style={labelStyle}>{data.label || 'Indicator Node'}</label>
      <span style={typeStyle}>Type: {data.indicatorType || 'Unknown'}</span>

      {/* Utgangshåndtak (f.eks., for indikatorverdi) */}
      <Handle
        type="source"
        position={Position.Right}
        id="value-out" // Unik ID for dette håndtaket
        style={{ top: '50%', background: '#555' }}
      />
    </div>
  );
}

export default IndicatorNode;