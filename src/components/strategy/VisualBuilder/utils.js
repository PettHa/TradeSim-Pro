// Counter for unique ID generation
let nodeCounter = 1;

/**
 * Generate a unique ID for a node based on its type
 * @param {string} type - Node type (e.g., 'indicatorNode')
 * @returns {string} - Unique ID
 */
export const getNodeId = (type) => {
  const prefix = type.replace('Node', '');
  const id = `${prefix}_${nodeCounter++}`;
  return id;
};

/**
 * Find a suitable position for a new node
 * @param {Array} nodes - Existing nodes in the graph
 * @returns {Object} - {x, y} coordinates
 */
export const generateNodePosition = (nodes) => {
  // Default position if no nodes
  if (!nodes || nodes.length === 0) {
    return { x: 250, y: 150 };
  }
  
  // Find the rightmost node
  const rightmostNode = nodes.reduce((max, node) => {
    return (node.position.x > max.position.x) ? node : max;
  }, nodes[0]);
  
  // Place the new node to the right with some space
  return { 
    x: rightmostNode.position.x + 200, 
    y: rightmostNode.position.y
  };
};

/**
 * Get indicator parameters based on type
 * @param {string} type - Indicator type (e.g., 'SMA', 'RSI')
 * @returns {Object} - Default parameters for the indicator
 */
export const getIndicatorParams = (type) => {
  switch (type) {
    case 'SMA':
      return { period: 20 };
    case 'EMA':
      return { period: 20 };
    case 'RSI':
      return { period: 14, levels: { oversold: 30, overbought: 70 } };
    case 'MACD':
      return { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 };
    case 'BBANDS':
      return { period: 20, stdDev: 2 };
    case 'STOCH':
      return { kPeriod: 14, dPeriod: 3, slowing: 3 };
    default:
      return {};
  }
};

/**
 * Generate a strategy object from nodes and edges
 * @param {Array} nodes - All nodes in the flow
 * @param {Array} edges - All edges connecting the nodes
 * @returns {Object} - Strategy object that can be passed to the backtester
 */
export const generateStrategy = (nodes, edges) => {
  // This is a simplified version - in a real implementation,
  // you would need to analyze the graph and convert it to a strategy format
  // that your backtester can understand
  
  // Find entry and exit nodes
  const entryNodes = nodes.filter(n => 
    n.type === 'actionNode' && 
    n.data.actionType === 'ENTRY'
  );
  
  const exitNodes = nodes.filter(n => 
    n.type === 'actionNode' && 
    n.data.actionType === 'EXIT'
  );
  
  // Basic strategy structure
  const strategy = {
    name: 'Visual Strategy',
    longEnabled: entryNodes.some(n => n.data.positionType === 'LONG'),
    shortEnabled: entryNodes.some(n => n.data.positionType === 'SHORT'),
    longEntryIndicators: [],
    longExitIndicators: [],
    shortEntryIndicators: [],
    shortExitIndicators: [],
    // Default risk management settings
    stopLoss: 5,
    takeProfit: 15,
    initialCapital: 10000,
    positionSize: 10
  };
  
  // In a real implementation, you would traverse the graph from 
  // action nodes backward to build the complete condition chains
  
  return strategy;
};

/**
 * Find all nodes that connect to a target node
 * @param {string} targetNodeId - ID of the target node
 * @param {Array} allNodes - All nodes in the flow
 * @param {Array} allEdges - All edges in the flow
 * @returns {Array} - Array of nodes that connect to the target
 */
export const findInputNodes = (targetNodeId, allNodes, allEdges) => {
  const inputEdges = allEdges.filter(edge => edge.target === targetNodeId);
  
  return inputEdges.map(edge => {
    const sourceNode = allNodes.find(node => node.id === edge.source);
    return {
      node: sourceNode,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    };
  });
};

/**
 * Find all nodes that a source node connects to
 * @param {string} sourceNodeId - ID of the source node
 * @param {Array} allNodes - All nodes in the flow
 * @param {Array} allEdges - All edges in the flow
 * @returns {Array} - Array of nodes that the source connects to
 */
export const findOutputNodes = (sourceNodeId, allNodes, allEdges) => {
  const outputEdges = allEdges.filter(edge => edge.source === sourceNodeId);
  
  return outputEdges.map(edge => {
    const targetNode = allNodes.find(node => node.id === edge.target);
    return {
      node: targetNode,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    };
  });
};