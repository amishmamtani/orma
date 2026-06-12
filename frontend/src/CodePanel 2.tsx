import { useRef, useState } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'

interface Props {
  code: string
  filename: string
  loading: boolean
  error: string
  onChange: (code: string, filename?: string) => void
  onRun: () => void
}

export function CodePanel({ code, filename, loading, error, onChange, onRun }: Props) {
  const [dragging, setDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.py')) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target?.result as string, file.name)
    reader.readAsText(file)
  }

  return (
    <div
      className="absolute flex flex-col rounded-xl overflow-hidden"
      style={{
        top: 16,
        left: 16,
        width: '33vw',
        height: 'calc(100vh - 32px)',
        background: '#1e1e1e',
        border: `1px solid ${dragging ? '#4f46e5' : '#2a2a2a'}`,
        zIndex: 10,
        transition: 'border-color 0.15s',
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid #2a2a2a' }}
      >
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
          style={{ background: '#2a2a2a', color: '#aaa' }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#3b82f6' }} />
          {filename}
        </div>

        <button
          onClick={onRun}
          disabled={loading || !code.trim()}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-40 hover:bg-white/10"
          style={{ background: '#2a2a2a', color: '#e5e5e5', border: '1px solid #333' }}
        >
          {loading
            ? <span className="inline-block w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin" />
            : <span style={{ fontSize: 9 }}>▶</span>
          }
          {loading ? 'Running…' : 'Run'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden relative">
        {code ? (
          <>
            {/* Syntax highlighted display */}
            <div className="absolute inset-0 overflow-auto" style={{ zIndex: 0 }}>
              <SyntaxHighlighter
                language="python"
                style={atomOneDark}
                wrapLongLines={false}
                customStyle={{
                  background: 'transparent',
                  margin: 0,
                  padding: '16px',
                  fontSize: 12,
                  lineHeight: 1.7,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  minHeight: '100%',
                  whiteSpace: 'pre',
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
            {/* Transparent textarea for editing — sits on top, cursor visible */}
            <textarea
              ref={textareaRef}
              className="absolute inset-0 w-full h-full p-4 resize-none focus:outline-none"
              style={{
                background: 'transparent',
                color: 'transparent',
                caretColor: '#e5e5e5',
                fontSize: 12,
                lineHeight: 1.7,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                whiteSpace: 'pre',
                overflowX: 'auto',
                zIndex: 1,
              }}
              value={code}
              onChange={e => onChange(e.target.value)}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              className="absolute inset-0 w-full h-full p-4 font-mono resize-none focus:outline-none"
              style={{ background: 'transparent', color: 'transparent', caretColor: '#e5e5e5', fontSize: 12, zIndex: 1 }}
              value={code}
              onChange={e => onChange(e.target.value)}
              spellCheck={false}
            />
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none"
              style={{ pointerEvents: 'none' }}
            >
              <span style={{ fontSize: 40 }}>👻</span>
              <p className="text-xs text-center leading-relaxed px-8" style={{ color: '#555' }}>
                Hi! I'm Orma, Press Enter to start typing or<br />drag or drop your python file
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error bar */}
      {error && (
        <div
          className="px-4 py-2 text-xs flex-shrink-0"
          style={{ background: '#2a1515', color: '#f87171', borderTop: '1px solid #3a1515' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
