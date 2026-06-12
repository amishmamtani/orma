import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingInIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'

interface Props {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onAddNode: () => void
  onGeneratePrompt: () => void
  generating: boolean
  canGenerate: boolean
  zoom: number
}

export function Toolbar({ onZoomIn, onZoomOut, onFitView, onAddNode, onGeneratePrompt, generating, canGenerate, zoom }: Props) {
  const iconBtn = "w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10"

  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 rounded-xl"
      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
    >
      <button onClick={onZoomIn} className={iconBtn} style={{ color: '#888' }} title="Zoom in">
        <MagnifyingGlassPlusIcon className="w-4 h-4" />
      </button>
      <span className="text-xs tabular-nums w-10 text-center" style={{ color: '#666' }}>
        {Math.round(zoom * 100)}%
      </span>
      <button onClick={onZoomOut} className={iconBtn} style={{ color: '#888' }} title="Zoom out">
        <MagnifyingGlassMinusIcon className="w-4 h-4" />
      </button>
      <button onClick={onFitView} className={iconBtn} style={{ color: '#888' }} title="Fit view">
        <ArrowsPointingInIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-5 mx-1" style={{ background: '#2a2a2a' }} />

      <button
        onClick={onAddNode}
        disabled={!canGenerate}
        className={iconBtn + ' disabled:opacity-40'}
        style={{ color: '#888' }}
        title="Add node"
      >
        <PlusCircleIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-5 mx-1" style={{ background: '#2a2a2a' }} />

      <button
        onClick={onGeneratePrompt}
        disabled={!canGenerate || generating}
        className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
        style={{ background: '#4f46e5', color: '#fff' }}
      >
        {generating ? 'Generating…' : 'Generate Prompt'}
      </button>
    </div>
  )
}
