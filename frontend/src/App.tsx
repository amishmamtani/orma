import { useState } from 'react'
import ReactFlow, { Background, Controls, type Node, type Edge } from 'reactflow'
import 'reactflow/dist/style.css'

interface ParseNode {
  id: string
  label: string
  raw_code: string
  line_start: number
  line_end: number
  children: ParseNode[]
}

function buildFlow(nodes: ParseNode[]): { nodes: Node[]; edges: Edge[] } {
  const flowNodes: Node[] = nodes.map((n, i) => ({
    id: n.id,
    position: { x: 250, y: i * 120 },
    data: { label: n.label },
  }))

  const flowEdges: Edge[] = nodes.slice(1).map((n, i) => ({
    id: `edge_${i}`,
    source: nodes[i].id,
    target: n.id,
  }))

  return { nodes: flowNodes, edges: flowEdges }
}

function App() {
  const [code, setCode] = useState('')
  const [flowNodes, setFlowNodes] = useState<Node[]>([])
  const [flowEdges, setFlowEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleParse() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:8000/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Something went wrong.')
        return
      }
      const data = await res.json()
      const { nodes, edges } = buildFlow(data.nodes)
      setFlowNodes(nodes)
      setFlowEdges(edges)
    } catch {
      setError('Could not reach the backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold text-stone-900">orma</h1>
      <div className="flex flex-col gap-3 max-w-2xl">
        <textarea
          className="w-full h-48 p-3 font-mono text-sm bg-white border border-stone-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-stone-400"
          placeholder="Paste your Python code here..."
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <button
          onClick={handleParse}
          disabled={loading || !code.trim()}
          className="self-start px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-700 disabled:opacity-40 transition"
        >
          {loading ? 'Parsing...' : 'Parse'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      {flowNodes.length > 0 && (
        <div className="w-full h-[500px] border border-stone-200 rounded-lg bg-white">
          <ReactFlow nodes={flowNodes} edges={flowEdges} fitView>
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      )}
    </div>
  )
}

export default App
