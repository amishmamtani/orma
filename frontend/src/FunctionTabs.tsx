import type { FunctionData } from './FunctionChart'

export const FUNCTION_COLORS = ['#4ade80', '#f472b6', '#38bdf8', '#fb923c', '#a78bfa', '#facc15']

interface Props {
  functions: FunctionData[]
  activeId: string | null
  onSelect: (id: string) => void
}

export function FunctionTabs({ functions, activeId, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2">
      {functions.map((func, i) => {
        const color = FUNCTION_COLORS[i % FUNCTION_COLORS.length]
        const isActive = func.id === activeId
        return (
          <button
            key={func.id}
            onClick={() => onSelect(func.id)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: isActive ? '#2a2a2a' : '#1a1a1a',
              color: isActive ? '#f0f0f0' : '#888',
              border: `1px solid ${isActive ? '#3a3a3a' : '#242424'}`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: color }}
            />
            {func.name}
          </button>
        )
      })}
    </div>
  )
}
