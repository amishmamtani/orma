import { useEffect, useRef, useState } from 'react'
import ghostSrc from './assets/ghost.svg'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'

interface HighlightRange {
  lineStart: number
  lineEnd: number
  color: string
}

interface Props {
  code: string
  filename: string
  loading: boolean
  error: string
  highlightRange?: HighlightRange | null
  onChange: (code: string, filename?: string) => void
  onRun: () => void
}

export function CodePanel({ code, filename, loading, error, highlightRange, onChange, onRun }: Props) {
  const [dragging, setDragging] = useState(false)
  const [overlayPos, setOverlayPos] = useState<{ top: number; height: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlighterRef = useRef<HTMLDivElement>(null)

  function syncScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    if (highlighterRef.current) {
      highlighterRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  // Measure actual DOM positions for the highlight overlay — works regardless of line wrapping
  useEffect(() => {
    if (!highlightRange || !highlighterRef.current) {
      setOverlayPos(null)
      return
    }
    const container = highlighterRef.current
    // Each line is a direct <span> child of <code> when wrapLines={true}
    const lineSpans = Array.from(container.querySelectorAll('code > span')) as HTMLElement[]
    const startEl = lineSpans[highlightRange.lineStart - 1]
    const endEl   = lineSpans[highlightRange.lineEnd - 1]
    if (!startEl || !endEl) { setOverlayPos(null); return }

    const containerRect = container.getBoundingClientRect()
    const startRect     = startEl.getBoundingClientRect()
    const endRect       = endEl.getBoundingClientRect()

    const top    = startRect.top - containerRect.top + container.scrollTop
    const height = endRect.bottom - startRect.top

    setOverlayPos({ top, height })

    // Scroll so highlighted lines are visible
    const newScroll = Math.max(0, top - 60)
    container.scrollTop = newScroll
    if (textareaRef.current) textareaRef.current.scrollTop = newScroll
  }, [highlightRange])

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
      className="absolute flex flex-col rounded-lg overflow-hidden"
      style={{
        top: 12,
        left: 12,
        width: '33vw',
        height: 'calc(100vh - 24px)',
        background: '#28282B',
        border: `1px solid ${dragging ? '#4f46e5' : '#36363B'}`,
        zIndex: 10,
        transition: 'border-color 0.15s',
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-2 py-1.5 flex-shrink-0"
        style={{ borderBottom: '1px solid #36363B' }}
      >
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
          style={{ background: '#36363B', color: '#aaa' }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#3b82f6' }} />
          {filename}
        </div>

        <button
          onClick={onRun}
          disabled={loading || !code.trim()}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-40 hover:opacity-80"
          style={{ background: '#4f46e5', color: '#fff', border: 'none' }}
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
            {/* Syntax highlighted display — scrollable, driven by textarea scroll */}
            <div ref={highlighterRef} className="absolute inset-0 overflow-y-auto no-scrollbar" style={{ zIndex: 0 }}>
              <div style={{ position: 'relative' }}>
                <SyntaxHighlighter
                  language="python"
                  style={atomOneDark}
                  wrapLines={true}
                  wrapLongLines={true}
                  lineProps={{ style: { display: 'block' } } as React.HTMLProps<HTMLElement>}
                  customStyle={{
                    background: 'transparent',
                    margin: 0,
                    padding: '16px',
                    fontSize: 12,
                    lineHeight: 1.7,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  }}
                >
                  {code}
                </SyntaxHighlighter>
                {overlayPos && highlightRange && (
                  <div style={{
                    position: 'absolute',
                    top: overlayPos.top,
                    left: 0,
                    right: 0,
                    height: overlayPos.height,
                    backgroundColor: `${highlightRange.color}26`,
                    borderLeft: `3px solid ${highlightRange.color}`,
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            </div>
            {/* Transparent textarea — captures input and scroll, no visual */}
            <textarea
              ref={textareaRef}
              className="absolute inset-0 w-full h-full p-4 resize-none focus:outline-none no-scrollbar"
              style={{
                background: 'transparent',
                color: 'transparent',
                caretColor: '#e5e5e5',
                fontSize: 12,
                lineHeight: 1.7,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                overflowY: 'auto',
                zIndex: 1,
              }}
              value={code}
              onChange={e => onChange(e.target.value)}
              onScroll={syncScroll}
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
              <div className="flex flex-col items-center gap-3" style={{ transform: 'translateY(-32px)' }}>
                <div className="flex flex-col items-center" style={{ gap: 6 }}>
                  <img
                    src={ghostSrc}
                    width={36}
                    height={46}
                    alt=""
                    style={{ animation: 'ghost-float 3.8s linear infinite' }}
                  />
                  <div style={{
                    width: 28,
                    height: 3.4,
                    borderRadius: '50%',
                    background: '#000',
                    filter: 'blur(5px)',
                    animation: 'shadow-pulse 3.8s linear infinite',
                  }} />
                </div>
                <p className="text-xs text-center leading-relaxed px-8" style={{ color: '#555' }}>
                  Hi! I'm Orma, Press Enter to start typing or<br />drag or drop your python file
                </p>
              </div>
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
