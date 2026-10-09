import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, KeyRound, Eye, EyeOff, RefreshCw, Trash2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import TypeIcon from '@/components/TypeIcon'
import { TYPE_META } from '@/data/spaces'
import { hasKey, importPlaces } from '@/lib/places'
import { lookupAll } from '@/lib/assessor'
import { useStore } from '@/store'

export default function Import() {
  const spaces = useStore((s) => s.spaces)
  const hidden = useStore((s) => s.hidden)
  const skipped = useStore((s) => s.skipped)
  const importedAt = useStore((s) => s.importedAt)
  const progress = useStore((s) => s.progress)
  const importError = useStore((s) => s.importError)
  const setProgress = useStore((s) => s.setProgress)
  const setImportError = useStore((s) => s.setImportError)
  const setSpaces = useStore((s) => s.setSpaces)
  const patchSpace = useStore((s) => s.patchSpace)
  const toggleHidden = useStore((s) => s.toggleHidden)
  const clearImport = useStore((s) => s.clearImport)
  const [showSkipped, setShowSkipped] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const keyed = hasKey()
  const running = progress !== null
  const sized = spaces.filter((s) => s.sqft != null).length

  async function pull() {
    setImportError(null)
    setProgress({ stage: 'places', done: 0, total: 1, note: 'Starting…' })
    try {
      const result = await importPlaces(setProgress)
      setSpaces(result.spaces, result.skipped)
      setProgress({ stage: 'assessor', done: 0, total: result.spaces.length, note: 'Square footage from the SF Assessor…' })
      await lookupAll(result.spaces, (id, f, count) => {
        patchSpace(id, { sqft: f.sqft, sqftSource: f.source })
        setProgress({ stage: 'assessor', done: count, total: result.spaces.length, note: `Square footage: ${count} of ${result.spaces.length}` })
      })
      if (result.errors.length) setImportError(result.errors.join('\n'))
    } catch (e) {
      setImportError((e as Error).message)
    } finally {
      setProgress(null)
    }
  }

  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto p-3 md:p-6">
      <div className="rule pb-2">
        <h1 className="font-display text-4xl leading-none">The real Sunset</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Google Places for every small business, hours, phone, and interior photos; the SF Assessor for square footage.
        </p>
      </div>

      <section className="mt-4 bg-card border border-border rounded-[var(--radius)] p-4">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
          <KeyRound className="w-4 h-4" /> 1 · Google key
          {keyed ? <Badge>connected</Badge> : <Badge variant="outline">missing</Badge>}
        </div>
        {!keyed && (
          <ol className="mt-2 text-sm list-decimal pl-5 space-y-1">
            <li>In Google Cloud, enable <strong>Places API (New)</strong> and create an API key.</li>
            <li>Restrict it: Application → Websites → this site's address (and the preview's). API → Places API (New) only.</li>
            <li>Env tab here: add <code className="font-mono bg-secondary px-1">GOOGLE_MAPS_API_KEY</code>, marked <strong>public</strong>. Reload the preview.</li>
          </ol>
        )}
        {keyed && (
          <p className="mt-2 text-sm text-muted-foreground">
            One pull is about 60 Google requests, well inside the free monthly tier. Google asks that this data be refreshed within 30 days — pull again monthly.
          </p>
        )}
      </section>

      <section className="mt-3 bg-card border border-border rounded-[var(--radius)] p-4">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
          <Database className="w-4 h-4" /> 2 · Pull
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button size="lg" onClick={pull} disabled={!keyed || running}>
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Pulling…' : importedAt ? 'Pull again' : 'Pull the Sunset'}
          </Button>
          {importedAt && !running && (
            <span className="font-mono text-xs text-muted-foreground">
              last pulled {new Date(importedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          )}
        </div>
        {progress && (
          <div className="mt-3">
            <div className="h-3 bg-secondary border border-border rounded-[var(--radius)] overflow-hidden">
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{progress.note}</p>
          </div>
        )}
        {importError && (
          <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-destructive bg-background border border-destructive/40 rounded-[var(--radius)] p-2">
            {importError}
          </pre>
        )}
      </section>

      {spaces.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Database />}
            title="Sample spaces are on the map for now"
            hint={keyed ? 'Pull once and the real Sunset replaces them.' : 'Add the key above, then pull.'}
            action={<Button asChild variant="outline"><Link to="/">See the map</Link></Button>}
          />
        </div>
      ) : (
        <section className="mt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 rule pb-1">
            <span className="font-mono text-xs uppercase tracking-wider">
              {spaces.length} spaces · {sized} with square footage · {hidden.length} hidden
            </span>
            {skipped.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSkipped((v) => !v)}
                className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground underline"
              >
                {skipped.length} chains left out <ChevronDown className={`w-3 h-3 transition-transform ${showSkipped ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          {showSkipped && (
            <p className="mt-2 text-xs text-muted-foreground">{skipped.join(' · ')}</p>
          )}

          <ul className="mt-2 divide-y divide-border">
            {spaces.map((s) => {
              const off = hidden.includes(s.id)
              return (
                <li key={s.id} className={`flex items-center gap-3 py-2 ${off ? 'opacity-50' : ''}`}>
                  <TypeIcon type={s.type} className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/space/${s.id}`} className="font-semibold hover:underline">{s.name}</Link>
                    <div className="font-mono text-xs text-muted-foreground truncate">
                      {TYPE_META[s.type].label} · {s.address} · {s.sqft ? `${s.sqft.toLocaleString()} sq ft` : 'no sq ft'}
                      {s.hoursKnown === false ? ' · no hours listed' : ''}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleHidden(s.id)}
                    aria-label={off ? `Show ${s.name}` : `Hide ${s.name}`}
                    title={off ? 'Show on map' : 'Hide — chain or not a fit'}
                  >
                    {off ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 flex items-center gap-2">
            {confirmClear ? (
              <>
                <Button variant="destructive" size="sm" onClick={() => { clearImport(); setConfirmClear(false) }}>
                  Yes, back to samples
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>Keep</Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
                <Trash2 className="w-4 h-4" /> Clear pulled data
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}