import { useState } from 'react'

interface Props {
  text: string
  generating: boolean
  onClose: () => void
}

export function PromptPanel({ text, generating, onClose }: Props) {
  const [minimized, setMinimized] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-t-xl overflow-hidden transition-all duration-300"
      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderBottom: 'none' }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: minimized ? 'none' : '1px solid #2a2a2a' }}
      >
        <button
          onClick={handleCopy}
          disabled={generating || !text}
          className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs transition-all disabled:opacity-40"
          style={{
            background: '#252525',
            color: copied ? '#4ade80' : '#e5e5e5',
            border: '1px solid #333',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(m => !m)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all hover:bg-white/10"
            style={{ color: '#666' }}
          >
            —
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs transition-all hover:bg-white/10"
            style={{ color: '#666' }}
          >
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="px-4 py-3 overflow-y-auto" style={{ maxHeight: 220 }}>
          {generating ? (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#666' }}>
              <span className="animate-pulse">●</span>
              Generating prompt…
            </div>
          ) : (
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: '#d4d4d4' }}>
              {text}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
