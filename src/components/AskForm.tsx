import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DAY_LONG, fmtRange, fmtHour, type Day, type Space } from '@/data/spaces'
import { useStore } from '@/store'

const HOURS = Array.from({ length: 31 }, (_, i) => 9 + i * 0.5)

export default function AskForm({ space }: { space: Space }) {
  const navigate = useNavigate()
  const day = useStore((s) => s.day)
  const hour = useStore((s) => s.hour)
  const addAsk = useStore((s) => s.addAsk)

  const snapped = Math.max(9, Math.round(hour * 2) / 2)
  const [askDay, setAskDay] = useState<Day>(day)
  const [start, setStart] = useState(snapped)
  const [end, setEnd] = useState(Math.min(24, snapped + 2))
  const [what, setWhat] = useState('')
  const [people, setPeople] = useState(8)
  const [from, setFrom] = useState('Von')
  const [sending, setSending] = useState(false)

  const r = space.hours[askDay]
  const conflict = space.hoursKnown !== false && r ? start < r[1] && end > r[0] : false
  const valid = what.trim().length > 0 && end > start && !conflict

  function send() {
    if (!valid) return
    setSending(true)
    addAsk({ spaceId: space.id, from: from.trim() || 'Neighbor', day: askDay, start, end, what: what.trim(), people })
    setTimeout(() => navigate('/asks'), 300)
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); send() }}
      className="bg-card border border-border rounded-[var(--radius)] p-4 h-fit md:sticky md:top-20 shadow-[0_3px_0_var(--border)]"
    >
      <h2 className="font-display text-3xl leading-none">Ask to use the room</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-3">
        Goes to {space.contactName ?? 'the owner'}. Short and specific works best.
      </p>

      <div className="grid gap-3">
        <div>
          <Label htmlFor="from">Your name</Label>
          <Input id="from" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="day">Day</Label>
          <Select id="day" value={askDay} onChange={(e) => setAskDay(Number(e.target.value) as Day)}>
            {DAY_LONG.map((d, i) => (
              <option key={d} value={i}>{d} — {space.hoursKnown === false ? 'hours not listed' : fmtRange(space.hours[i])}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="start">From</Label>
            <Select id="start" value={start} onChange={(e) => setStart(Number(e.target.value))}>
              {HOURS.map((h) => <option key={h} value={h}>{fmtHour(h)}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="end">Until</Label>
            <Select id="end" value={end} onChange={(e) => setEnd(Number(e.target.value))}>
              {HOURS.map((h) => <option key={h} value={h}>{fmtHour(h)}</option>)}
            </Select>
          </div>
        </div>
        {conflict && (
          <p className="text-sm text-destructive font-mono">They're open then — pick a time outside {fmtRange(r)}.</p>
        )}
        {!conflict && end <= start && (
          <p className="text-sm text-destructive font-mono">End needs to come after start.</p>
        )}
        <div>
          <Label htmlFor="what">What you'd do</Label>
          <Textarea
            id="what"
            rows={3}
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            placeholder="Free tea ceremony for neighbors — I bring everything, leave it cleaner than I found it."
          />
        </div>
        <div>
          <Label htmlFor="people">How many people</Label>
          <Input id="people" type="number" min={1} max={200} value={people} onChange={(e) => setPeople(Number(e.target.value))} />
        </div>
        <Button type="submit" size="lg" disabled={!valid || sending}>
          {sending ? 'Sending…' : 'Send the ask'}
        </Button>
      </div>
    </form>
  )
}