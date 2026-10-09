import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_ASKS, SPACES, type Ask, type Area, type Day, type SizeBucket, type Space, type SpaceType } from '@/data/spaces'
import type { ImportProgress } from '@/lib/places'

export type { Ask }
export type Persona = 'neighbor' | 'owner'
export type SizeFilter = 'all' | Exclude<SizeBucket, 'unknown'>
export type AreaFilter = 'all' | Area

function startingWhen(): { day: Day; hour: number } {
  const now = new Date()
  const h = now.getHours() + (now.getMinutes() >= 30 ? 0.5 : 0)
  return { day: now.getDay() as Day, hour: Math.min(24, Math.max(9, h)) }
}

interface State {
  day: Day
  hour: number
  setWhen: (day: Day, hour: number) => void
  types: SpaceType[]
  toggleType: (t: SpaceType) => void
  size: SizeFilter
  setSize: (s: SizeFilter) => void
  area: AreaFilter
  setArea: (a: AreaFilter) => void
  freeOnly: boolean
  setFreeOnly: (v: boolean) => void
  clearFilters: () => void
  selectedId: string | null
  select: (id: string | null) => void
  persona: Persona
  setPersona: (p: Persona) => void
  asks: Ask[]
  addAsk: (a: Omit<Ask, 'id' | 'status' | 'createdAt'>) => Ask
  respond: (id: string, status: Ask['status'], reply: string) => void

  // Imported data — empty means the sample spaces show
  spaces: Space[]
  importedAt: string | null
  hidden: string[]
  skipped: string[]
  progress: ImportProgress | null
  importError: string | null
  setProgress: (p: ImportProgress | null) => void
  setImportError: (e: string | null) => void
  setSpaces: (spaces: Space[], skipped: string[]) => void
  patchSpace: (id: string, patch: Partial<Space>) => void
  toggleHidden: (id: string) => void
  clearImport: () => void
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...startingWhen(),
      setWhen: (day, hour) => set({ day, hour }),
      types: [],
      toggleType: (t) =>
        set((s) => ({ types: s.types.includes(t) ? s.types.filter((x) => x !== t) : [...s.types, t] })),
      size: 'all',
      setSize: (size) => set({ size }),
      area: 'all',
      setArea: (area) => set({ area }),
      freeOnly: false,
      setFreeOnly: (freeOnly) => set({ freeOnly }),
      clearFilters: () => set({ types: [], size: 'all', area: 'all', freeOnly: false }),
      selectedId: null,
      select: (selectedId) => set({ selectedId }),
      persona: 'neighbor',
      setPersona: (persona) => set({ persona }),
      asks: SEED_ASKS,
      addAsk: (a) => {
        const ask: Ask = { ...a, id: `ask-${Date.now()}`, status: 'sent', createdAt: new Date().toISOString() }
        set((s) => ({ asks: [ask, ...s.asks] }))
        return ask
      },
      respond: (id, status, reply) =>
        set((s) => ({ asks: s.asks.map((a) => (a.id === id ? { ...a, status, reply } : a)) })),

      spaces: [],
      importedAt: null,
      hidden: [],
      skipped: [],
      progress: null,
      importError: null,
      setProgress: (progress) => set({ progress }),
      setImportError: (importError) => set({ importError }),
      setSpaces: (spaces, skipped) =>
        set({ spaces, skipped, importedAt: new Date().toISOString(), importError: null, selectedId: null }),
      patchSpace: (id, patch) =>
        set((s) => ({ spaces: s.spaces.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      toggleHidden: (id) =>
        set((s) => ({ hidden: s.hidden.includes(id) ? s.hidden.filter((x) => x !== id) : [...s.hidden, id] })),
      clearImport: () => set({ spaces: [], importedAt: null, hidden: [], skipped: [], progress: null, importError: null, selectedId: null }),
    }),
    {
      name: 'sunset-after-hours',
      partialize: (s) => ({
        asks: s.asks,
        persona: s.persona,
        spaces: s.spaces,
        importedAt: s.importedAt,
        hidden: s.hidden,
        skipped: s.skipped,
      }),
    },
  ),
)

/** All spaces currently on the map: imported ones if any, else the samples. Hidden ones removed. */
export function useSpaces(): Space[] {
  const live = useStore((s) => s.spaces)
  const hidden = useStore((s) => s.hidden)
  const base = live.length ? live : SPACES
  return hidden.length ? base.filter((s) => !hidden.includes(s.id)) : base
}