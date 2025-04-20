import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css'; // Importer standard React Flow stiler

import './VisualStrategyBuilder.css';
import IndicatorNode from './nodes/IndicatorNode';
import LogicNode from './nodes/LogicNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import Panel from '../../common/Panel/Panel'; // Gjenbruk Panel
import Button from '../../common/Button/Button'; // Gjenbruk Button

// Definer initielle noder for demonstrasjon
const initialNodes = [
  { id: 'price', type: 'input', data: { label: 'Markedsdata (Close)' }, position: { x: 50, y: 150 } },
  {
    id: 'sma1', type: 'indicatorNode', // Bruk custom type
    data: { label: 'SMA (20)', indicatorType: 'SMA' },
    position: { x: 250, y: 50 },
  },
  {
    id: 'rsi1', type: 'indicatorNode',
    data: { label: 'RSI (14)', indicatorType: 'RSI' },
    position: { x: 250, y: 150 }
  },
  {
    id: 'cond1', type: 'conditionNode',
    data: { conditionLabel: '>' },
    position: { x: 500, y: 100 }
  },
  {
    id: 'logic1', type: 'logicNode',
    data: { logicType: 'AND' },
    position: { x: 700, y: 150 }
  },
  {
    id: 'action1', type: 'actionNode',
    data: { actionType: 'Enter Long' },
    position: { x: 900, y: 150 }
  }
];

// Definer initielle koblinger (kan være tom)
const initialEdges = [
    // Eksempel: Koble Pris til SMA og RSI
    { id: 'e-price-sma', source: 'price', target: 'sma1', targetHandle: 'price-in' /* Hvis definert */, animated: false, style: { stroke: '#aaa' } },
    { id: 'e-price-rsi', source: 'price', target: 'rsi1', targetHandle: 'price-in' /* Hvis definert */, animated: false, style: { stroke: '#aaa' } },
    // Eksempel: Koble SMA og RSI til Condition
    { id: 'e-sma-cond', source: 'sma1', sourceHandle: 'value-out', target: 'cond1', targetHandle: 'val-a', animated: true },
    { id: 'e-rsi-cond', source: 'rsi1', sourceHandle: 'value-out', target: 'cond1', targetHandle: 'val-b', animated: true },
    // Eksempel: Koble Condition til Logic
    { id: 'e-cond-logic', source: 'cond1', sourceHandle: 'out', target: 'logic1', targetHandle: 'in-a', animated: true },
    // Eksempel: Koble Logic til Action
    { id: 'e-logic-action', source: 'logic1', sourceHandle: 'out', target: 'action1', targetHandle: 'trigger-in', animated: true },
];

let idCounter = Math.max(...initialNodes.map(n => parseInt(n.id.replace(/[^0-9]/g,''), 10)), 0) + 1;
const getNodeId = (prefix = 'node') => `${prefix}_${idCounter++}`;

function VisualStrategyBuilder({ strategy, onStrategyChange, disabled }) {
  // Definer custom node typer som React Flow skal bruke
  const nodeTypes = useMemo(() => ({
    indicatorNode: IndicatorNode,
    logicNode: LogicNode,
    conditionNode: ConditionNode,
    actionNode: ActionNode,
    // React Flow sine innebygde kan også brukes: 'input', 'output', 'default'
  }), []);

  // State for noder og kanter
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // Callbacks for endringer i noder og kanter
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Callback for når en kobling lages
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  // Funksjon for å legge til en ny node (enkelt eksempel)
  const addNode = (type, nodeDataType = 'default', nodeData = {}) => {
    const newNode = {
      id: getNodeId(nodeDataType),
      type: type, // f.eks 'indicatorNode', 'logicNode'
      position: {
        x: Math.random() * 400 + 50, // Tilfeldig posisjon
        y: Math.random() * 300 + 50,
      },
      data: nodeData, // Send data til node-komponenten
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // TODO: Lagre/parse funksjonalitet
  const handleSave = () => {
      console.log("Saving visual strategy (Nodes):", nodes);
      console.log("Saving visual strategy (Edges):", edges);
      // Her må vi oversette 'nodes' og 'edges' til den logiske trestrukturen
      // som backtesteren kan forstå. Dette er et komplekst steg for senere.
      alert("Save functionality not implemented yet. Check console for nodes/edges data.");
  };

  return (
    <Panel title="Visual Strategy Builder (Experimental)">
        {/* TODO: Legg til kontroller for å legge til ulike nodetyper */}
        <div className="visual-strategy-controls">
             <Button size="sm" variant="secondary" onClick={() => addNode('indicatorNode', 'indicator', { label: 'New Indicator', indicatorType: 'SMA' })}>+ Indicator</Button>
             <Button size="sm" variant="secondary" onClick={() => addNode('logicNode', 'logic', { logicType: 'AND' })}>+ Logic (AND)</Button>
             <Button size="sm" variant="secondary" onClick={() => addNode('conditionNode', 'condition', { conditionLabel: '>' })}>+ Condition</Button>
             <Button size="sm" variant="secondary" onClick={() => addNode('actionNode', 'action', { actionType: 'Enter Long' })}>+ Action</Button>
             <Button size="sm" variant="primary" onClick={handleSave} style={{ marginLeft: 'auto' }}>Save Visual</Button>
        </div>

        {/* ReactFlowProvider er lurt hvis du skal bruke hooks som useReactFlow */}
        <ReactFlowProvider>
             <div className="visual-strategy-builder">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes} // Fortell React Flow om custom nodene
                    fitView // Zoom ut for å vise alle noder ved start
                    attributionPosition="top-right" // Flytt React Flow logo
                >
                    <Controls />
                    <MiniMap nodeStrokeWidth={3} zoomable pannable />
                    <Background variant="dots" gap={12} size={1} />
                </ReactFlow>
            </div>
        </ReactFlowProvider>
    </Panel>
  );
}

export default VisualStrategyBuilder;