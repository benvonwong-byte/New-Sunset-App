import { X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import TypeIcon from '@/components/TypeIcon'
import { TYPES, TYPE_META, SIZE_LABEL } from '@/data/spaces'
import { useStore } from '@/store'

export default function Filters() {
  const types = useStore((s) => s.types)
  const toggleType = useStore((s) => s.toggleType)
  const size = useStore((s) => s.size)
  const setSize = useStore((s) => s.setSize)
  const area = useStore((s) => s.area)
  const setArea = useStore((s) => s.setArea)
  const freeOnly = useStore((s) => s.freeOnly)
  const setFreeOnly = useStore((s) => s.setFreeOnly)
  const clearFilters = useStore((s) => s.clearFilters)
  const dirty = types.length > 0 || size !== 'all' || area !== 'all' || freeOnly

  return (
    <section className="flex flex-col gap-2">
      <div className="chip-rail -mx-3 px-3 md:mx-0 md:px-0 flex md:flex-wrap gap-2 overflow-x-auto">
        {TYPES.map((t) => {
          const on = types.includes(t)
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              aria-pressed={on}
              className={`shrink-0 inline-flex items-center gap-1.5 h-11 px-3 rounded-[var(--radius)] border font-mono text-sm transition-colors ${
                on ? 'bg-accent border-foreground shadow-[0_2px_0_var(--foreground)]' : 'bg-card border-border hover:bg-secondary'
              }`}
            >
              <TypeIcon type={t} className="w-4 h-4" />
              {TYPE_META[t].label}
            </button>
          )
        })}
        {dirty && (
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 inline-flex items-center gap-1 h-11 px-3 font-mono text-sm text-muted-foreground underline"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <Select value={size} onChange={(e) => setSize(e.target.value as typeof size)} aria-label="Size">
          <option value="all">Any size</option>
          <option value="small">{SIZE_LABEL.small}</option>
          <option value="medium">{SIZE_LABEL.medium}</option>
          <option value="large">{SIZE_LABEL.large}</option>
        </Select>
        <Select value={area} onChange={(e) => setArea(e.target.value as typeof area)} aria-label="Area">
          <option value="all">Inner + Outer Sunset</option>
          <option value="Inner Sunset">Inner Sunset</option>
          <option value="Outer Sunset">Outer Sunset</option>
        </Select>
        <label className="col-span-2 flex items-center justify-between h-11 px-1">
          <span className="font-mono text-sm">Only rooms that are free right then</span>
          <Switch checked={freeOnly} onCheckedChange={setFreeOnly} />
        </label>
      </div>
    </section>
  )
}