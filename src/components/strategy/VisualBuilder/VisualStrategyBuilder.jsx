import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import './VisualStrategyBuilder.css';
import IndicatorNode from './nodes/IndicatorNode';
import LogicNode from './nodes/LogicNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import PriceNode from './nodes/PriceNode';
import { getNodeId, generateNodePosition } from './utils';
import NodePicker from './NodePicker';
import NodeConfig from './NodeConfig';
import AddNodeDropdown from './AddNodeDropdown';

// Custom edge with animated path
import CustomEdge from './edges/CustomEdge';

// Define custom edge types
const edgeTypes = {
  customEdge: CustomEdge
};

// Initial nodes - market data source and action nodes
const initialNodes = [
  {
    id: 'price',
    type: 'priceNode',
    data: { label: 'Market Data', outputLabels: ['OHLC', 'Volume'] },
    position: { x: 50, y: 150 },
  },
  {
    id: 'entry',
    type: 'actionNode',
    data: { label: 'Enter Long', actionType: 'ENTRY', positionType: 'LONG' },
    position: { x: 700, y: 100 },
  },
  {
    id: 'exit',
    type: 'actionNode',
    data: { label: 'Exit Long', actionType: 'EXIT', positionType: 'LONG' },
    position: { x: 700, y: 250 },
  }
];

// Initial edges
const initialEdges = [];


function VisualStrategyBuilder({ disabled = false, fullscreen = false }) {
  // State for nodes and edges
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [rfInstance, setRfInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeSelectorOpen, setNodeSelectorOpen] = useState(false);
  const [nodeSelectorPosition, setNodeSelectorPosition] = useState({ x: 0, y: 0 });
  
  // Refs
  const reactFlowWrapper = useRef(null);
  
  // Find selected node object
  const selectedNodeObject = selectedNode ? nodes.find(node => node.id === selectedNode) : null;

  // Callbacks for node and edge changes
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Callback for edge connections
  const onConnect = useCallback(
    (connection) => {
      const newEdge = {
        ...connection,
        type: 'customEdge',
        animated: true
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    []
  );

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    event.preventDefault();
    setSelectedNode(node.id);
  }, []);

  // Clear selection when clicking on the canvas
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setNodeSelectorOpen(false);
  }, []);

  // Handle right-click on canvas to open node selector
  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    
    if (!reactFlowWrapper.current) return;

    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    
    // Get position relative to the ReactFlow canvas
    const position = rfInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    });

    setNodeSelectorPosition(position);
    setNodeSelectorOpen(true);
  }, [rfInstance]);

  // Add a new node
  const addNode = useCallback((type, nodeData = {}) => {
    // Generate a unique ID based on type
    const id = getNodeId(type);
    
    // Generate position near the center or based on existing nodes
    const position = generateNodePosition(nodes);
    
    console.log("Adding new node:", { type, id, position, nodeData });
    
    const newNode = {
      id,
      type,
      position,
      data: { 
        ...nodeData,
        id // Add the ID to the node data for referencing
      }
    };
    
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(id); // Select the new node
  }, [nodes]);

  // Update node data
  const updateNodeData = useCallback((id, newData) => {
    setNodes(nodes => nodes.map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...newData
          }
        };
      }
      return node;
    }));
  }, []);
  
  // Define custom node types with updateNodeData passed to them
  const nodeTypes = useMemo(() => ({
    indicatorNode: (props) => <IndicatorNode {...props} updateNodeData={updateNodeData} />,
    logicNode: (props) => <LogicNode {...props} updateNodeData={updateNodeData} />,
    conditionNode: (props) => <ConditionNode {...props} updateNodeData={updateNodeData} />,
    actionNode: (props) => <ActionNode {...props} updateNodeData={updateNodeData} />,
    priceNode: (props) => <PriceNode {...props} updateNodeData={updateNodeData} />
  }), [updateNodeData]);

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    
    // Don't delete price node
    if (selectedNode === 'price') return;
    
    // Remove node
    setNodes(nodes => nodes.filter(node => node.id !== selectedNode));
    
    // Remove all connected edges
    setEdges(edges => edges.filter(
      edge => edge.source !== selectedNode && edge.target !== selectedNode
    ));
    
    setSelectedNode(null);
  }, [selectedNode]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Delete selected node with Delete key
      if (event.key === 'Delete' && selectedNode) {
        deleteSelectedNode();
      }
      
      // Escape key to clear selection
      if (event.key === 'Escape') {
        setSelectedNode(null);
        setNodeSelectorOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, deleteSelectedNode]);

  // Save the strategy to JSON
  const saveStrategy = useCallback(() => {
    if (!rfInstance) return;
    
    const flow = rfInstance.toObject();
    const strategyData = JSON.stringify(flow);
    
    // In a real app, this would save to backend or localStorage
    console.log('Strategy saved:', flow);
    alert('Strategy saved to console (JSON data)');
    
    // You could store in localStorage like this:
    // localStorage.setItem('savedStrategy', strategyData);
  }, [rfInstance]);

  // Load a saved strategy
  const loadStrategy = useCallback(() => {
    // In a real app, this would load from backend or localStorage
    // const savedStrategy = localStorage.getItem('savedStrategy');
    // if (savedStrategy) {
    //   const flow = JSON.parse(savedStrategy);
    //   setNodes(flow.nodes || []);
    //   setEdges(flow.edges || []);
    // }
    
    alert('Loading saved strategies not implemented yet');
  }, []);

  return (
    <div className={`visual-strategy-builder-container ${fullscreen ? 'fullscreen-mode' : ''}`} data-disabled={disabled}>
      <div className="visual-strategy-controls">
        <AddNodeDropdown 
          onAddNode={addNode}
          disabled={disabled}
        />
        
        <button 
          className="strategy-control-btn delete-btn" 
          onClick={deleteSelectedNode}
          disabled={disabled || !selectedNode || selectedNode === 'price'}
        >
          Delete Selected
        </button>
        
        <div className="strategy-control-spacer"></div>
        
        <button 
          className="strategy-control-btn secondary-btn" 
          onClick={loadStrategy}
          disabled={disabled}
        >
          Load
        </button>
        <button 
          className="strategy-control-btn primary-btn" 
          onClick={saveStrategy}
          disabled={disabled}
        >
          Save Strategy
        </button>
      </div>
      
      <div className="strategy-editor-container">
        <ReactFlowProvider>
          <div ref={reactFlowWrapper} className="reactflow-wrapper">
          <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onInit={setRfInstance}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onPaneContextMenu={onPaneContextMenu}
              fitView
              snapToGrid={true}
              snapGrid={[10, 10]}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              minZoom={0.3}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={!disabled}
              nodesConnectable={!disabled}
              elementsSelectable={!disabled}
              defaultEdgeOptions={{ type: 'customEdge' }}
            >
              <Background color="#aaa" gap={16} size={1} />
              <Controls showInteractive={false} />
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.type === 'priceNode') return '#0041d0';
                  if (n.type === 'indicatorNode') return '#ff0072';
                  if (n.type === 'conditionNode') return '#057a55';
                  if (n.type === 'logicNode') return '#1a192b';
                  if (n.type === 'actionNode') return '#ff0000';
                  return '#eee';
                }}
                nodeColor={(n) => {
                  if (n.type === 'priceNode') return '#e6f2ff';
                  if (n.type === 'indicatorNode') return '#fff1f0';
                  if (n.type === 'conditionNode') return '#e3fcf7';
                  if (n.type === 'logicNode') return '#e6ebf5';
                  if (n.type === 'actionNode') return '#fff0f0';
                  return '#fff';
                }}
                nodeBorderRadius={3}
              />
              
              {/* Node picker for context menu */}
              {nodeSelectorOpen && (
                <Panel position="top-left" style={{ left: nodeSelectorPosition.x, top: nodeSelectorPosition.y }}>
                  <NodePicker 
                    onAddNode={addNode}
                    onClose={() => setNodeSelectorOpen(false)}
                    position={nodeSelectorPosition}
                  />
                </Panel>
              )}
            </ReactFlow>
          </div>
        </ReactFlowProvider>
        
        {selectedNodeObject && (
          <NodeConfig 
            node={selectedNodeObject} 
            updateNodeData={updateNodeData}
          />
        )}
      </div>
    </div>
  );
}

export default VisualStrategyBuilder;