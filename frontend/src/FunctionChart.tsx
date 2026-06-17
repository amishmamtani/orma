import { useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'

export interface ParseNode {
  id: string
  type: string
  label: string
  raw_code: string
  line_start: number
  line_end: number
  called_function?: string
  call_description?: string
  call_output?: string
}

export interface ParseEdge {
  id: string
  source: string
  target: string
  label: string
}

export interface FunctionData {
  id: string
  name: string
  nodes: ParseNode[]
  edges: ParseEdge[]
}

const NODE_STYLES: Record<string, React.CSSProperties> = {
  start:     { background: '#1c1917', color: '#fff', borderRadius: 6, minWidth: 200, fontSize: 13, border: 'none' },
  end:       { background: '#1c1917', color: '#fff', borderRadius: 6, minWidth: 200, fontSize: 13, border: 'none' },
  loop:      { background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 6, minWidth: 200, fontSize: 13 },
  condition: { background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 6, minWidth: 200, fontSize: 13 },
  action:    { background: '#fff',    border: '1px solid #d6d3d1', borderRadius: 6, minWidth: 200, fontSize: 13 },
}

function toFlowNodes(parseNodes: ParseNode[]): Node[] {
  return parseNodes.map((n, i) => ({
    id: n.id,
    position: { x: 100, y: i * 110 },
    data: { label: n.label },
    style: NODE_STYLES[n.type] ?? NODE_STYLES.action,
  }))
}

function toFlowEdges(parseEdges: ParseEdge[]): Edge[] {
  return parseEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label || undefined,
    labelStyle: { fontSize: 11, fill: '#78716c' },
    labelBgStyle: { fill: '#fafaf9' },
  }))
}

interface Props {
  func: FunctionData
}

export function FunctionChart({ func }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(func.nodes))
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(func.edges))

  const onConnect = useCallback(
    (connection: Connection) => setEdges(prev => addEdge(connection, prev)),
    [setEdges],
  )

  function addStep() {
    const newNode: Node = {
      id: `${func.id}_added_${Date.now()}`,
      position: { x: 100, y: nodes.length * 110 },
      data: { label: 'New step' },
      style: NODE_STYLES.action,
    }
    setNodes(prev => [...prev, newNode])
  }

  return (
    <div className="flex flex-col gap-2 flex-shrink-0" style={{ width: 360 }}>
      <div className="flex items-center justify-between px-1">
        <h2 className="font-semibold text-stone-900 text-sm">{func.name}</h2>
        <button
          onClick={addStep}
          className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
        >
          + Add step
        </button>
      </div>
      <div className="h-[600px] border border-stone-200 rounded-lg bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
