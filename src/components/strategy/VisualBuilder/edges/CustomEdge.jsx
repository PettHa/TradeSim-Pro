import React from 'react';
import { BaseEdge, getSmoothStepPath } from 'reactflow';

// Custom edge component with animated dashed line
function CustomEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd }) {
  // Get path for edge
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Combine default style with passed style
  const customStyle = {
    stroke: '#555',
    strokeWidth: 1.5,
    strokeDasharray: '5,5',
    ...style
  };

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={customStyle}
    />
  );
}

export default CustomEdge;