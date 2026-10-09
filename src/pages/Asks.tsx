import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { DAY_LONG, fmtHour, type Ask } from '@/data/spaces'
import { useStore, useSpaces, type Persona } from '@/store'

function AskRow({ ask, persona }: { ask: Ask; persona: Persona }) {
  const respond = useStore((s) => s.respond)
  const spaces = useSpaces()
  const [reply, setReply] = useState('')
  const space = spaces.find((s) => s.id === ask.spaceId)
  if (!space) return null
  const who = persona === 'owner' ? ask.from : space.contactName ?? space.name

  return (
    <li className="bg-card border border-border rounded-[var(--radius)] p-3">
      <div className="flex items-start gap-3">
        <Avatar name={who} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">{persona === 'owner' ? ask.from : space.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {DAY_LONG[ask.day]} {fmtHour(ask.start)}–{fmtHour(ask.end)} · {ask.people} people
            </span>
          </div>
          <p className="text-sm mt-0.5">{ask.what}</p>
          {persona === 'neighbor' && (
            <Link to={`/space/${space.id}`} className="text-xs underline text-muted-foreground">{space.address}</Link>
          )}

          <div className="mt-2 font-mono text-xs">
            {ask.status === 'yes' && <Badge>Yes{ask.reply ? ` — ${ask.reply}` : ''}</Badge>}
            {ask.status === 'no' && <Badge variant="outline">Not this time{ask.reply ? ` — ${ask.reply}` : ''}</Badge>}
            {ask.status === 'sent' && persona === 'neighbor' && (
              <Badge variant="secondary">Waiting on {space.contactName ?? 'the owner'}</Badge>
            )}
          </div>

          {ask.status === 'sent' && persona === 'owner' && (
            <div className="mt-3 grid gap-2">
              <Input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="A line back — where the key is, what to know"
              />
              <div className="flex gap-2">
                <Button onClick={() => respond(ask.id, 'yes', reply.trim())}>Yes, come</Button>
                <Button variant="outline" onClick={() => respond(ask.id, 'no', reply.trim())}>Not this time</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

export default function Asks() {
  const asks = useStore((s) => s.asks)
  const persona = useStore((s) => s.persona)
  const setPersona = useStore((s) => s.setPersona)

  const shown = [...asks].sort((a, b) => (a.status === 'sent' ? -1 : 1) - (b.status === 'sent' ? -1 : 1))
  const waiting = asks.filter((a) => a.status === 'sent').length

  return (
    <div className="max-w-3xl mx-auto p-3 md:p-6">
      <div className="flex items-end justify-between gap-3 rule pb-2">
        <h1 className="font-display text-4xl leading-none">
          {persona === 'owner' ? 'Asks for your room' : 'Your asks'}
        </h1>
        <div className="inline-flex border border-border rounded-[var(--radius)] overflow-hidden font-mono text-sm" role="group" aria-label="View as">
          {(['neighbor', 'owner'] as Persona[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPersona(p)}
              aria-pressed={persona === p}
              className={`h-10 px-3 ${persona === p ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'}`}
            >
              {p === 'neighbor' ? 'As Von' : 'As the owner'}
            </button>
          ))}
        </div>
      </div>

      {persona === 'owner' && waiting > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {waiting} waiting — a quick yes or no keeps neighbors from calling the shop.
        </p>
      )}

      {shown.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<MessageCircle />}
            title="No asks yet"
            hint="Find a room that's free and send the first one."
            action={<Button asChild><Link to="/">Open the map</Link></Button>}
          />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {shown.map((a) => <AskRow key={a.id} ask={a} persona={persona} />)}
        </ul>
      )}
    </div>
  )
}