import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance,
  type NodeProps,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { FunctionData, ParseNode, ParseEdge } from './FunctionChart'
import { FUNCTION_COLORS } from './FunctionTabs'

const COLUMN_GAP = 120
const NODE_W = 220
const V_SPACING = 110
const BRANCH_GAP = 60  // horizontal gap between sibling branches

const NODE_STYLE: React.CSSProperties = {
  background: '#1f2128',
  color: '#f0f0f0',
  borderRadius: 8,
  width: NODE_W,
  fontSize: 13,
  border: '1px solid #2d3148',
  padding: '10px 14px',
  textAlign: 'center',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
}

function EditableNode({ id, data, selected }: NodeProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { setNodes } = useReactFlow()

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function startEdit() {
    setDraft(String(data.label))
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const value = draft.trim()
    if (!value) return
    setNodes(nodes => nodes.map(n =>
      n.id === id ? { ...n, data: { ...n.data, label: value } } : n
    ))
  }

  const handleStyle = { background: '#3d3d3d', border: 'none', width: 8, height: 8 }

  return (
    <>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      {selected && (
        <div style={{
          position: 'absolute', inset: -2, borderRadius: 9,
          border: `2px solid ${String(data.color ?? '#4f46e5')}`,
          pointerEvents: 'none',
        }} />
      )}
      <div
        onDoubleClick={startEdit}
        style={{ textAlign: 'center', width: '100%', cursor: 'default' }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setEditing(false)
            }}
            style={{
              background: 'transparent',
              color: '#f0f0f0',
              border: 'none',
              outline: 'none',
              textAlign: 'center',
              fontSize: 13,
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <span>{String(data.label)}</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </>
  )
}

function FunctionHeaderNode({ data }: NodeProps<{ label: string; color: string }>) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: '#252836',
        borderRadius: 8,
        border: `1px solid ${data.color}44`,
        color: '#f0f0f0',
        fontSize: 13,
        fontWeight: 500,
        width: NODE_W,
        cursor: 'default',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: data.color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {data.label}
    </div>
  )
}

const nodeTypes = { functionHeader: FunctionHeaderNode, editable: EditableNode }

function layoutNodes(parseNodes: ParseNode[], parseEdges: ParseEdge[]): Map<string, { x: number; y: number }> {
  const out = new Map<string, Array<{ target: string; label: string }>>()
  for (const n of parseNodes) out.set(n.id, [])
  for (const e of parseEdges) out.get(e.source)?.push({ target: e.target, label: e.label ?? '' })

  const positions = new Map<string, { x: number; y: number }>()
  const placed = new Set<string>()

  function findMerge(aId: string, bId: string): string | null {
    const fromA = new Set<string>()
    const q1 = [aId]
    while (q1.length) {
      const curr = q1.shift()!
      if (fromA.has(curr)) continue
      fromA.add(curr)
      if (curr === bId) return bId
      for (const e of out.get(curr) ?? []) q1.push(e.target)
    }
    const fromB = new Set<string>()
    const q2 = [bId]
    while (q2.length) {
      const curr = q2.shift()!
      if (fromB.has(curr)) continue
      fromB.add(curr)
      for (const e of out.get(curr) ?? []) q2.push(e.target)
    }
    const q3 = [aId]
    const seen3 = new Set<string>()
    while (q3.length) {
      const curr = q3.shift()!
      if (seen3.has(curr)) continue
      seen3.add(curr)
      if (fromB.has(curr) && curr !== aId) return curr
      for (const e of out.get(curr) ?? []) q3.push(e.target)
    }
    return null
  }

  function branchDepth(startId: string, stopId: string | null): number {
    let count = 0, curr = startId
    const seen = new Set<string>()
    while (curr && curr !== stopId) {
      if (seen.has(curr)) break
      seen.add(curr); count++
      const outs = out.get(curr) ?? []
      if (!outs.length) break
      curr = outs[0].target
    }
    return count
  }

  // Returns the horizontal space a subtree needs so parent branches don't overlap
  function treeWidth(nodeId: string, stopBefore: string | null, seen = new Set<string>()): number {
    if (!nodeId || nodeId === stopBefore || seen.has(nodeId) || !out.has(nodeId)) return NODE_W
    seen.add(nodeId)
    const outs = out.get(nodeId) ?? []
    if (outs.length <= 1) {
      const next = outs[0]?.target
      if (next && next !== stopBefore && !seen.has(next)) return treeWidth(next, stopBefore, seen)
      return NODE_W
    }
    const yesEdge = outs.find(e => e.label === 'Yes') ?? outs[0]
    const noEdge  = outs.find(e => e.label === 'No')  ?? outs[1]
    const merge   = findMerge(yesEdge.target, noEdge.target)
    const isNoElse = merge === noEdge.target
    if (isNoElse && merge) {
      const yesW = treeWidth(yesEdge.target, merge, new Set(seen))
      return yesW + BRANCH_GAP / 2 + NODE_W
    } else if (merge) {
      const yesW = treeWidth(yesEdge.target, merge, new Set(seen))
      const noW  = treeWidth(noEdge.target,  merge, new Set(seen))
      return yesW + BRANCH_GAP + noW
    } else {
      const yesW = treeWidth(yesEdge.target, null, new Set(seen))
      const noW  = treeWidth(noEdge.target,  null, new Set(seen))
      return yesW + BRANCH_GAP + noW
    }
  }

  function place(nodeId: string, cx: number, y: number, stopBefore: string | null = null): number {
    if (placed.has(nodeId) || !out.has(nodeId) || nodeId === stopBefore) return y
    placed.add(nodeId)
    positions.set(nodeId, { x: cx - NODE_W / 2, y })

    const outs = out.get(nodeId) ?? []
    if (!outs.length) return y + V_SPACING
    if (outs.length === 1) {
      const next = outs[0].target
      if (placed.has(next) || next === stopBefore) return y + V_SPACING
      return place(next, cx, y + V_SPACING, stopBefore)
    }

    const yesEdge = outs.find(e => e.label === 'Yes') ?? outs[0]
    const noEdge  = outs.find(e => e.label === 'No')  ?? outs[1]
    const mergeId = findMerge(yesEdge.target, noEdge.target)
    const branchY = y + V_SPACING
    const noElse  = mergeId === noEdge.target

    if (noElse && mergeId) {
      const yesW  = treeWidth(yesEdge.target, mergeId)
      const yesCx = cx - (NODE_W / 2 + BRANCH_GAP / 2 + yesW / 2)
      const depth = branchDepth(yesEdge.target, mergeId)
      place(yesEdge.target, yesCx, branchY, mergeId)
      const mergeY = branchY + Math.max(depth, 1) * V_SPACING
      if (!placed.has(mergeId)) return place(mergeId, cx, mergeY, stopBefore)
    } else if (mergeId) {
      const yesW  = treeWidth(yesEdge.target, mergeId)
      const noW   = treeWidth(noEdge.target,  mergeId)
      const yesCx = cx - (noW  + BRANCH_GAP) / 2
      const noCx  = cx + (yesW + BRANCH_GAP) / 2
      const yDepth = branchDepth(yesEdge.target, mergeId)
      const nDepth = branchDepth(noEdge.target,  mergeId)
      place(yesEdge.target, yesCx, branchY, mergeId)
      place(noEdge.target,  noCx,  branchY, mergeId)
      const mergeY = branchY + Math.max(yDepth, nDepth, 1) * V_SPACING
      if (!placed.has(mergeId)) return place(mergeId, cx, mergeY, stopBefore)
    } else {
      const yesW = treeWidth(yesEdge.target, null)
      const noW  = treeWidth(noEdge.target,  null)
      const yesCx = cx - (noW  + BRANCH_GAP) / 2
      const noCx  = cx + (yesW + BRANCH_GAP) / 2
      if (!placed.has(yesEdge.target)) place(yesEdge.target, yesCx, branchY, stopBefore)
      if (!placed.has(noEdge.target))  place(noEdge.target,  noCx,  branchY, stopBefore)
    }
    return y + V_SPACING
  }

  const startNode = parseNodes.find(n => n.type === 'start')
  if (startNode) {
    const totalWidth = treeWidth(startNode.id, null)
    place(startNode.id, totalWidth / 2, 0)
  }

  let fallbackY = [...positions.values()].reduce((m, p) => Math.max(m, p.y), 0) + V_SPACING
  for (const n of parseNodes) {
    if (!positions.has(n.id)) {
      positions.set(n.id, { x: 0, y: fallbackY })
      fallbackY += V_SPACING
    }
  }

  return positions
}

function buildGraph(functions: FunctionData[]) {
  const nodes: Node[] = []
  const edges: Edge[] = []
  let xCursor = 0

  functions.forEach((func, fi) => {
    const color = FUNCTION_COLORS[fi % FUNCTION_COLORS.length]
    const layout = layoutNodes(func.nodes, func.edges)

    // Compute bounding box to determine column width and shift
    let minX = Infinity, maxX = -Infinity
    for (const pos of layout.values()) {
      minX = Math.min(minX, pos.x)
      maxX = Math.max(maxX, pos.x + NODE_W)
    }
    if (!isFinite(minX)) { minX = 0; maxX = NODE_W }
    const funcWidth = maxX - minX
    const xShift = xCursor - minX

    nodes.push({
      id: `${func.id}_header`,
      type: 'functionHeader',
      position: { x: xCursor + funcWidth / 2 - NODE_W / 2, y: -60 },
      data: { label: `${func.name}()`, color },
      draggable: false,
      selectable: false,
    })

    func.nodes.forEach(n => {
      const pos = layout.get(n.id) ?? { x: 0, y: 0 }
      nodes.push({
        id: n.id,
        type: 'editable',
        position: { x: xShift + pos.x, y: pos.y + 20 },
        data: {
          label: n.label,
          nodeType: n.type,
          raw_code: n.raw_code,
          line_start: n.line_start,
          line_end: n.line_end,
          color,
        },
        style: NODE_STYLE,
      })
    })

    const endNodeIds = new Set(func.nodes.filter(n => n.type === 'end').map(n => n.id))

    func.edges.forEach(e => {
      // End nodes are true terminals — edges FROM them are AST artifacts, not real flow
      if (endNodeIds.has(e.source)) return
      edges.push({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        pathOptions: { borderRadius: 20 },
        label: e.label || undefined,
        labelStyle: { fontSize: 13, fill: '#fff' },
        labelBgStyle: { fill: 'transparent' },
        style: { stroke: color, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 20, height: 20 },
      })
    })

    xCursor += funcWidth + COLUMN_GAP
  })

  return { nodes, edges }
}

export interface CanvasHandle {
  getSnapshot: () => { nodes: Node[]; edges: Edge[] }
  zoomIn: () => void
  zoomOut: () => void
  fitView: () => void
  addNode: (funcId: string) => void
  focusFunction: (funcId: string) => void
}

interface NodeSelectRange {
  lineStart: number
  lineEnd: number
  color: string
}

interface Props {
  functions: FunctionData[]
  onZoomChange?: (zoom: number) => void
  onNodeSelect?: (range: NodeSelectRange | null) => void
}

export const Canvas = forwardRef<CanvasHandle, Props>(function Canvas({ functions, onZoomChange, onNodeSelect }, ref) {
  const { nodes: initial, edges: initialEdges } = buildGraph(functions)
  const [nodes, setNodes, onNodesChange] = useNodesState(initial)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const flowRef = useRef<ReactFlowInstance | null>(null)

  const onConnect = useCallback(
    (connection: Connection) => setEdges(prev => addEdge(connection, prev)),
    [setEdges],
  )

  useImperativeHandle(ref, () => ({
    getSnapshot: () => ({
      nodes: flowRef.current?.getNodes() ?? nodes,
      edges: flowRef.current?.getEdges() ?? edges,
    }),
    zoomIn: () => flowRef.current?.zoomIn(),
    zoomOut: () => flowRef.current?.zoomOut(),
    fitView: () => flowRef.current?.fitView(),
    focusFunction: (funcId: string) => {
      const current = flowRef.current?.getNodes() ?? nodes
      const funcNodeIds = current
        .filter(n => n.id.startsWith(funcId + '_'))
        .map(n => ({ id: n.id }))
      flowRef.current?.fitView({ nodes: funcNodeIds, maxZoom: 0.85, duration: 500, padding: 0.2 })
    },
    addNode: (funcId: string) => {
      const current = flowRef.current?.getNodes() ?? nodes
      const funcNodes = current.filter(n => n.id.startsWith(funcId + '_') && !n.id.endsWith('_header'))
      const maxY = funcNodes.reduce((max, n) => Math.max(max, n.position.y), 0)
      const centerX = funcNodes.reduce((sum, n) => sum + n.position.x, 0) / (funcNodes.length || 1)
      setNodes(prev => [
        ...prev,
        {
          id: `${funcId}_added_${Date.now()}`,
          type: 'editable',
          position: { x: centerX, y: maxY + V_SPACING },
          data: { label: 'New step', nodeType: 'action', raw_code: '', line_start: 0, line_end: 0 },
          style: NODE_STYLE,
        },
      ])
    },
  }))

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => {
        const { line_start, line_end, color } = node.data
        if (line_start && onNodeSelect) {
          onNodeSelect({ lineStart: line_start as number, lineEnd: line_end as number, color: color as string })
        }
      }}
      onPaneClick={() => onNodeSelect?.(null)}
      onInit={instance => {
        flowRef.current = instance
        instance.setViewport({ x: 40, y: 120, zoom: 0.85 })
        onZoomChange?.(0.85)
      }}
      onMove={(_, viewport) => onZoomChange?.(viewport.zoom)}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      style={{ background: '#111' }}
    >
      <Background variant={BackgroundVariant.Dots} color="#222" gap={20} size={1} />
    </ReactFlow>
  )
})
