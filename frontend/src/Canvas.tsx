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
  background: '#28282B',
  color: '#f0f0f0',
  borderRadius: 8,
  width: NODE_W,
  fontSize: 13,
  border: '1px solid #36363B',
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

function FunctionCallNode({ data }: NodeProps) {
  const color = String(data.color ?? '#a78bfa')
  const handleStyle = { background: '#3d3d3d', border: 'none', width: 8, height: 8 }

  return (
    <>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={{
        background: '#28282B',
        border: `1px solid ${color}55`,
        borderRadius: 8,
        width: NODE_W,
        fontSize: 12,
        overflow: 'hidden',
        textAlign: 'left',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 12px',
          borderBottom: `1px solid ${color}33`,
          background: `${color}12`,
        }}>
          <span style={{ color, fontWeight: 600, fontSize: 12 }}>{String(data.called_function ?? '')}()</span>
        </div>
        <div style={{ padding: '8px 12px', color: '#ccc', lineHeight: 1.5, borderBottom: '1px solid #36363B' }}>
          {String(data.call_description ?? data.label ?? '')}
        </div>
        <div style={{ padding: '6px 12px', color: '#777', fontSize: 11, lineHeight: 1.4 }}>
          {String(data.call_output ?? '')}
        </div>
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
        background: '#28282B',
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

function accentDark(hex: string, mix = 0.2): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const dr = Math.round(r * mix + 0x18 * (1 - mix))
  const dg = Math.round(g * mix + 0x18 * (1 - mix))
  const db = Math.round(b * mix + 0x1a * (1 - mix))
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`
}

const nodeTypes = { functionHeader: FunctionHeaderNode, editable: EditableNode, functionCall: FunctionCallNode }

function layoutNodes(parseNodes: ParseNode[], parseEdges: ParseEdge[]): Map<string, { x: number; y: number }> {
  const out = new Map<string, Array<{ target: string; label: string }>>()
  for (const n of parseNodes) out.set(n.id, [])
  for (const e of parseEdges) out.get(e.source)?.push({ target: e.target, label: e.label ?? '' })

  const nodeTypeMap = new Map(parseNodes.map(n => [n.id, n.type]))
  function nodeVSpace(nodeId: string): number {
    return nodeTypeMap.get(nodeId) === 'function_call' ? V_SPACING + 75 : V_SPACING
  }

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

  function branchHeight(startId: string, stopId: string | null): number {
    let h = 0, curr = startId
    const seen = new Set<string>()
    while (curr && curr !== stopId) {
      if (seen.has(curr)) break
      seen.add(curr)
      h += nodeVSpace(curr)
      const outs = out.get(curr) ?? []
      if (!outs.length) break
      curr = outs[0].target
    }
    return Math.max(h, V_SPACING)
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
    if (!outs.length) return y + nodeVSpace(nodeId)
    if (outs.length === 1) {
      const next = outs[0].target
      if (placed.has(next) || next === stopBefore) return y + nodeVSpace(nodeId)
      return place(next, cx, y + nodeVSpace(nodeId), stopBefore)
    }

    const yesEdge = outs.find(e => e.label === 'Yes') ?? outs[0]
    const noEdge  = outs.find(e => e.label === 'No')  ?? outs[1]
    const mergeId = findMerge(yesEdge.target, noEdge.target)
    const branchY = y + nodeVSpace(nodeId)
    const noElse  = mergeId === noEdge.target

    if (noElse && mergeId) {
      const yesW  = treeWidth(yesEdge.target, mergeId)
      const yesCx = cx - (NODE_W / 2 + BRANCH_GAP / 2 + yesW / 2)
      place(yesEdge.target, yesCx, branchY, mergeId)
      const mergeY = branchY + branchHeight(yesEdge.target, mergeId)
      if (!placed.has(mergeId)) return place(mergeId, cx, mergeY, stopBefore)
    } else if (mergeId) {
      const yesW  = treeWidth(yesEdge.target, mergeId)
      const noW   = treeWidth(noEdge.target,  mergeId)
      const yesCx = cx - (noW  + BRANCH_GAP) / 2
      const noCx  = cx + (yesW + BRANCH_GAP) / 2
      place(yesEdge.target, yesCx, branchY, mergeId)
      place(noEdge.target,  noCx,  branchY, mergeId)
      const mergeY = branchY + Math.max(branchHeight(yesEdge.target, mergeId), branchHeight(noEdge.target, mergeId))
      if (!placed.has(mergeId)) return place(mergeId, cx, mergeY, stopBefore)
    } else {
      const yesW = treeWidth(yesEdge.target, null)
      const noW  = treeWidth(noEdge.target,  null)
      const yesCx = cx - (noW  + BRANCH_GAP) / 2
      const noCx  = cx + (yesW + BRANCH_GAP) / 2
      if (!placed.has(yesEdge.target)) place(yesEdge.target, yesCx, branchY, stopBefore)
      if (!placed.has(noEdge.target))  place(noEdge.target,  noCx,  branchY, stopBefore)
    }
    return y + nodeVSpace(nodeId)
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
      const isFuncCall = n.type === 'function_call'
      nodes.push({
        id: n.id,
        type: isFuncCall ? 'functionCall' : 'editable',
        position: { x: xShift + pos.x, y: pos.y + 20 },
        data: {
          label: n.label,
          nodeType: n.type,
          raw_code: n.raw_code,
          line_start: n.line_start,
          line_end: n.line_end,
          color,
          ...(isFuncCall && {
            called_function: n.called_function,
            call_description: n.call_description,
            call_output: n.call_output,
          }),
        },
        style: isFuncCall ? undefined : NODE_STYLE,
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
        labelStyle: { fontSize: 11, fill: '#ccc' },
        labelBgStyle: { fill: accentDark(color), fillOpacity: 1 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
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
  undo: () => void
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
  onDirtyChange?: (dirty: boolean) => void
}

export const Canvas = forwardRef<CanvasHandle, Props>(function Canvas({ functions, onZoomChange, onNodeSelect, onDirtyChange }, ref) {
  const { nodes: initial, edges: initialEdges } = buildGraph(functions)
  const [nodes, setNodes, onNodesChange] = useNodesState(initial)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const flowRef = useRef<ReactFlowInstance | null>(null)

  const historyRef = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([{ nodes: initial, edges: initialEdges }])
  const historyIdxRef = useRef(0)
  const isUndoingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isUndoingRef.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const snapshot = {
        nodes: (flowRef.current?.getNodes() ?? nodes).map(n => ({ ...n })),
        edges: (flowRef.current?.getEdges() ?? edges).map(e => ({ ...e })),
      }
      historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1)
      historyRef.current.push(snapshot)
      historyIdxRef.current = historyRef.current.length - 1
      onDirtyChange?.(historyIdxRef.current > 0)
    }, 300)
  }, [nodes, edges])

  function undo() {
    if (historyIdxRef.current <= 0) return
    isUndoingRef.current = true
    historyIdxRef.current -= 1
    const { nodes: prevNodes, edges: prevEdges } = historyRef.current[historyIdxRef.current]
    setNodes(prevNodes)
    setEdges(prevEdges)
    onDirtyChange?.(historyIdxRef.current > 0)
    setTimeout(() => { isUndoingRef.current = false }, 400)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const onConnect = useCallback(
    (connection: Connection) => {
      const allNodes = flowRef.current?.getNodes() ?? nodes
      const sourceNode = allNodes.find(n => n.id === connection.source)
      const color = (sourceNode?.data?.color as string) ?? '#4f46e5'
      setEdges(prev => addEdge({
        ...connection,
        type: 'smoothstep',
        pathOptions: { borderRadius: 20 },
        style: { stroke: color, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 20, height: 20 },
        labelStyle: { fontSize: 11, fill: '#ccc' },
        labelBgStyle: { fill: accentDark(color), fillOpacity: 1 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
      }, prev))
    },
    [setEdges, nodes],
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
    undo,
    addNode: (funcId: string) => {
      if (!flowRef.current) return
      const flowEl = document.querySelector('.react-flow')
      const rect = flowEl?.getBoundingClientRect()
      const screenCx = rect ? rect.width / 2 : 400
      const screenCy = rect ? rect.height / 2 : 300
      const pos = flowRef.current.project({ x: screenCx, y: screenCy })
      setNodes(prev => [
        ...prev,
        {
          id: `${funcId}_added_${Date.now()}`,
          type: 'editable',
          position: { x: pos.x - NODE_W / 2, y: pos.y - 40 },
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
      style={{ background: '#18181A' }}
    >
      <Background variant={BackgroundVariant.Dots} color="#3d3d3d" gap={20} size={1} />
    </ReactFlow>
  )
})
