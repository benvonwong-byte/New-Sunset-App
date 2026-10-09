import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import TimeDial from '@/components/TimeDial'
import SpaceMap from '@/components/SpaceMap'
import TypeIcon from '@/components/TypeIcon'
import Filters from '@/components/Filters'
import { SIZE_LABEL, STEWARD, sizeBucket, statusAt, freeWindows } from '@/data/spaces'
import { photoUrl } from '@/lib/places'
import { useStore, useSpaces } from '@/store'

export default function Browse() {
  const day = useStore((s) => s.day)
  const hour = useStore((s) => s.hour)
  const types = useStore((s) => s.types)
  const size = useStore((s) => s.size)
  const area = useStore((s) => s.area)
  const freeOnly = useStore((s) => s.freeOnly)
  const selectedId = useStore((s) => s.selectedId)
  const asks = useStore((s) => s.asks)
  const importedAt = useStore((s) => s.importedAt)
  const all = useSpaces()
  const listRef = useRef<HTMLUListElement>(null)

  const spaces = all.filter((s) => {
    if (types.length && !types.includes(s.type)) return false
    if (size !== 'all' && sizeBucket(s.sqft) !== size) return false
    if (area !== 'all' && s.area !== area) return false
    if (freeOnly && !statusAt(s, day, hour).free) return false
    return true
  })
  const freeCount = spaces.filter((s) => statusAt(s, day, hour).free).length

  useEffect(() => {
    if (!selectedId || !listRef.current) return
    listRef.current.querySelector(`[data-id="${selectedId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:h-[calc(100dvh-4rem)]">
      <div className="flex flex-col gap-3 min-h-0">
        <TimeDial />

        <Filters />

        <div className="md:hidden">
          <SpaceMap spaces={spaces} />
        </div>

        <div className="flex items-baseline justify-between rule pb-1">
          <span className="font-mono text-xs uppercase tracking-wider">
            {freeCount} of {spaces.length} free
            {!importedAt && (
              <Link to="/data" className="ml-2 normal-case tracking-normal underline text-muted-foreground">
                samples · pull the real Sunset
              </Link>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {STEWARD.name} {STEWARD.line}
          </span>
        </div>

        {spaces.length === 0 ? (
          <EmptyState
            icon={<MapPin />}
            title="Nothing matches yet"
            hint="Loosen a filter or slide the hour — the Sunset empties out after 6."
          />
        ) : (
          <ul ref={listRef} className="flex flex-col gap-2 md:overflow-y-auto md:min-h-0 md:pr-1">
            {spaces.map((s) => {
              const st = statusAt(s, day, hour)
              const yes = asks.find((a) => a.spaceId === s.id && a.status === 'yes')
              return (
                <li key={s.id} data-id={s.id}>
                  <Link
                    to={`/space/${s.id}`}
                    className={`block bg-card border rounded-[var(--radius)] p-3 hover:border-foreground ${
                      selectedId === s.id ? 'border-foreground ring-2 ring-ring' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {s.photos[0] ? (
                        <span className="relative shrink-0" aria-hidden="true">
                          <img
                            src={photoUrl(s.photos[0], 160)}
                            alt=""
                            loading="lazy"
                            className="w-14 h-14 object-cover rounded-[var(--radius)] border border-border bg-muted"
                          />
                          <span className={`pin absolute -bottom-1.5 -right-1.5 ${st.free ? '' : 'busy'}`} style={{ width: 24, height: 24 }}>
                            <TypeIcon type={s.type} className="w-3 h-3" />
                          </span>
                        </span>
                      ) : (
                        <span
                          className={`pin shrink-0 ${st.free ? '' : 'busy'}`}
                          style={{ width: 36, height: 36 }}
                          aria-hidden="true"
                        >
                          <TypeIcon type={s.type} className="w-[18px] h-[18px]" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-semibold">{s.name}</span>
                          {s.sample && <span className="text-xs text-muted-foreground">sample</span>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {s.address} · {s.area}
                        </div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap font-mono text-xs">
                          <Badge variant={st.free ? 'default' : 'outline'}>{st.label}</Badge>
                          <span>{s.sqft ? `${s.sqft.toLocaleString()} sq ft` : SIZE_LABEL.unknown}</span>
                          <span className="text-muted-foreground">free: {freeWindows(s, day).join(', ')}</span>
                        </div>
                        {yes && (
                          <div className="mt-1 text-xs">
                            <span className="font-display text-base leading-none text-accent-foreground bg-accent px-1.5 rounded-[var(--radius)]">
                              {yes.from} is here {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][yes.day]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="hidden md:block min-h-0">
        <SpaceMap spaces={spaces} />
      </div>
    </div>
  )
}