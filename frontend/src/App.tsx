import { useEffect, useRef, useState } from 'react'
import { Canvas, type CanvasHandle } from './Canvas'
import { CodePanel } from './CodePanel'
import { FunctionTabs } from './FunctionTabs'
import { Toolbar } from './Toolbar'
import { PromptPanel } from './PromptPanel'
import type { FunctionData } from './FunctionChart'

interface PromptState {
  text: string
  visible: boolean
  generating: boolean
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

function App() {
  const [code, setCode] = useState('')
  const [filename, setFilename] = useState('main.py')
  const [functions, setFunctions] = useState<FunctionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeFuncId, setActiveFuncId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState<PromptState>({ text: '', visible: false, generating: false })
  const [zoom, setZoom] = useState(0.85)
  const [highlightRange, setHighlightRange] = useState<{ lineStart: number; lineEnd: number; color: string } | null>(null)
  const [canvasHasChanges, setCanvasHasChanges] = useState(false)

  const canvasRef = useRef<CanvasHandle>(null)

  // Restore last parse result on mount so page reloads don't need a re-run
  useEffect(() => {
    try {
      const raw = localStorage.getItem('orma_parse_cache')
      if (!raw) return
      const { code: c, filename: f, functions: fns } = JSON.parse(raw)
      setCode(c); setFilename(f); setFunctions(fns)
      if (fns.length > 0) setActiveFuncId(fns[0].id)
    } catch { /* ignore corrupt cache */ }
  }, [])

  async function handleRun() {
    setLoading(true)
    setError('')
    setFunctions([])
    setActiveFuncId(null)
    setPrompt({ text: '', visible: false, generating: false })
    try {
      const res = await fetch(`${API_BASE}/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(import.meta.env.VITE_SECRET_TOKEN ? { 'X-Secret-Token': import.meta.env.VITE_SECRET_TOKEN } : {}),
        },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Something went wrong.')
        return
      }
      const data = await res.json()
      if (data.functions.length === 0) {
        setError('No functions or statements found in this code.')
        return
      }
      setFunctions(data.functions)
      if (data.functions.length > 0) setActiveFuncId(data.functions[0].id)
      setCanvasHasChanges(false)
      localStorage.setItem('orma_parse_cache', JSON.stringify({ code, filename, functions: data.functions }))
    } catch {
      setError("Couldn't reach the server. Make sure the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  async function handleGeneratePrompt() {
    const activeFunc = functions.find(f => f.id === activeFuncId)
    if (!activeFunc || !canvasRef.current) return

    setPrompt({ text: '', visible: true, generating: true })

    const { nodes, edges } = canvasRef.current.getSnapshot()
    const prefix = activeFunc.id + '_'

    const editedNodes = nodes
      .filter(n => n.id.startsWith(prefix) && !n.id.endsWith('_header'))
      .map(n => ({
        id: n.id,
        type: (n.data.nodeType as string) ?? 'action',
        label: String(n.data.label),
        raw_code: (n.data.raw_code as string) ?? '',
        line_start: (n.data.line_start as number) ?? 0,
        line_end: (n.data.line_end as number) ?? 0,
      }))

    const editedEdges = edges
      .filter(e => e.source.startsWith(prefix) || e.target.startsWith(prefix))
      .map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === 'string' ? e.label : '',
      }))

    try {
      const res = await fetch(`${API_BASE}/generate-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(import.meta.env.VITE_SECRET_TOKEN ? { 'X-Secret-Token': import.meta.env.VITE_SECRET_TOKEN } : {}),
        },
        body: JSON.stringify({
          function_name: activeFunc.name,
          original_nodes: activeFunc.nodes,
          original_edges: activeFunc.edges,
          edited_nodes: editedNodes,
          edited_edges: editedEdges,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setPrompt({ text: data.detail || 'Something went wrong generating the prompt. Try again.', visible: true, generating: false })
        return
      }
      const data = await res.json()
      setPrompt({ text: data.prompt, visible: true, generating: false })
    } catch {
      setPrompt({ text: "Couldn't reach the server. Make sure the backend is running.", visible: true, generating: false })
    }
  }

  function handleCodeChange(newCode: string, newFilename?: string) {
    setCode(newCode)
    if (newFilename) setFilename(newFilename)
  }

  const canvasLeft = 'calc(33vw + 32px)'

  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: '#18181A' }}>

      {/* Base layer: React Flow canvas — positioned right of code panel */}
      {functions.length > 0 && (
        <div className="absolute" style={{ left: 'calc(33vw + 32px)', top: 0, right: 0, bottom: 0 }}>
          <Canvas
            key={functions.map(f => f.id).join('-')}
            ref={canvasRef}
            functions={functions}
            onZoomChange={setZoom}
            onNodeSelect={setHighlightRange}
            onDirtyChange={setCanvasHasChanges}
          />
        </div>
      )}

      {/* Canvas placeholder — shown when no diagram is loaded */}
      {functions.length === 0 && (
        <div
          className="absolute flex items-center justify-center"
          style={{ left: 'calc(33vw + 32px)', top: 0, right: 0, bottom: 0 }}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#444', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#444', animationDelay: '200ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#444', animationDelay: '400ms' }} />
              </div>
              <p style={{ color: '#444', fontSize: 12 }}>Untangling the spaghetti…</p>
            </div>
          ) : (
            <p style={{ color: '#3a3a3a', fontSize: 13 }}>
              Paste your Python code and click Run to see the diagram
            </p>
          )}
        </div>
      )}

      {/* Function tabs — top, right of code panel */}
      {functions.length > 0 && (
        <div
          className="absolute top-4 flex items-center"
          style={{ left: canvasLeft, right: 16, zIndex: 10 }}
        >
          <FunctionTabs
            functions={functions}
            activeId={activeFuncId}
            onSelect={id => {
              setActiveFuncId(id)
              canvasRef.current?.focusFunction(id)
            }}
          />
        </div>
      )}

      {/* Floating code panel — always visible */}
      <CodePanel
        code={code}
        filename={filename}
        loading={loading}
        error={error}
        highlightRange={highlightRange}
        onChange={handleCodeChange}
        onRun={handleRun}
      />

      {/* Toolbar — bottom center of canvas area */}
      {functions.length > 0 && !prompt.visible && (
        <div
          className="absolute bottom-4 flex justify-center"
          style={{ left: canvasLeft, right: 16, zIndex: 10 }}
        >
          <Toolbar
            onZoomIn={() => canvasRef.current?.zoomIn()}
            onZoomOut={() => canvasRef.current?.zoomOut()}
            onFitView={() => canvasRef.current?.fitView()}
            onAddNode={() => activeFuncId && canvasRef.current?.addNode(activeFuncId)}
            onUndo={() => canvasRef.current?.undo()}
            onGeneratePrompt={handleGeneratePrompt}
            generating={prompt.generating}
            canGenerate={!!activeFuncId && canvasHasChanges}
            zoom={zoom}
          />
        </div>
      )}

      {/* Prompt panel — slides up from bottom */}
      {prompt.visible && (
        <div
          className="absolute bottom-0"
          style={{ left: canvasLeft, right: 0, zIndex: 20 }}
        >
          <PromptPanel
            text={prompt.text}
            generating={prompt.generating}
            onClose={() => setPrompt(p => ({ ...p, visible: false }))}
          />
        </div>
      )}

    </div>
  )
}

export default App
