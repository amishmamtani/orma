import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingInIcon,
  PlusCircleIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline'

interface Props {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onAddNode: () => void
  onUndo: () => void
  onGeneratePrompt: () => void
  generating: boolean
  canGenerate: boolean
  zoom: number
}

export function Toolbar({ onZoomIn, onZoomOut, onFitView, onAddNode, onUndo, onGeneratePrompt, generating, canGenerate, zoom }: Props) {
  const iconBtn = "w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/8"

  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 rounded-xl"
      style={{ background: '#28282B', border: '1px solid #36363B' }}
    >
      <button onClick={onZoomIn} className={iconBtn} style={{ color: '#aaa' }} title="Zoom in">
        <MagnifyingGlassPlusIcon className="w-4 h-4" />
      </button>
      <span className="text-xs tabular-nums w-10 text-center" style={{ color: '#888' }}>
        {Math.round(zoom * 100)}%
      </span>
      <button onClick={onZoomOut} className={iconBtn} style={{ color: '#aaa' }} title="Zoom out">
        <MagnifyingGlassMinusIcon className="w-4 h-4" />
      </button>
      <button onClick={onFitView} className={iconBtn} style={{ color: '#aaa' }} title="Fit view">
        <ArrowsPointingInIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-5 mx-1" style={{ background: '#36363B' }} />

      <button onClick={onUndo} className={iconBtn} style={{ color: '#aaa' }} title="Undo (⌘Z)">
        <ArrowUturnLeftIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-5 mx-1" style={{ background: '#36363B' }} />

      <button
        onClick={onAddNode}
        disabled={!canGenerate}
        className={iconBtn + ' disabled:opacity-40'}
        style={{ color: '#aaa' }}
        title="Add node"
      >
        <PlusCircleIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-5 mx-1" style={{ background: '#36363B' }} />

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
