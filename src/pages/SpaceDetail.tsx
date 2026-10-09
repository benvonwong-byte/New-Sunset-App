import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Globe, Camera, MapPin, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import TypeIcon from '@/components/TypeIcon'
import AskForm from '@/components/AskForm'
import { DAYS, DAY_LONG, TYPE_META, fmtRange, fmtHour, statusAt } from '@/data/spaces'
import { photoUrl } from '@/lib/places'
import { useStore, useSpaces } from '@/store'

export default function SpaceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const spaces = useSpaces()
  const space = spaces.find((s) => s.id === id)
  const day = useStore((s) => s.day)
  const hour = useStore((s) => s.hour)
  const asks = useStore((s) => s.asks)
  const toggleHidden = useStore((s) => s.toggleHidden)

  if (!space) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p>That space isn't on the map.</p>
        <Button asChild variant="link"><Link to="/">Back to the map</Link></Button>
      </div>
    )
  }

  const st = statusAt(space, day, hour)
  const here = asks.filter((a) => a.spaceId === space.id)

  return (
    <div className="max-w-5xl mx-auto p-3 md:p-6">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link to="/"><ArrowLeft className="w-4 h-4" /> Map</Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <div>
          <div className="flex items-start gap-3">
            <span className={`pin shrink-0 ${st.free ? '' : 'busy'}`} aria-hidden="true">
              <TypeIcon type={space.type} />
            </span>
            <div>
              <h1 className="font-display text-4xl leading-none">{space.name}</h1>
              <p className="text-muted-foreground">
                {TYPE_META[space.type].label} · {space.address} · {space.area}
                {space.sample && <span className="ml-2 text-xs">sample</span>}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 font-mono text-sm">
            <Badge variant={st.free ? 'default' : 'outline'}>{DAY_LONG[day]} {fmtHour(hour)}: {st.label}</Badge>
            <Badge variant="secondary">
              {space.sqft ? `${space.sqft.toLocaleString()} sq ft` : 'Size unknown'} · {space.sqftSource}
            </Badge>
          </div>

          {space.note && <p className="mt-3">{space.note}</p>}

          <h2 className="rule mt-5 pb-1 font-mono text-xs uppercase tracking-wider">Open hours</h2>
          <table className="w-full mt-2 font-mono text-sm">
            <tbody>
              {DAYS.map((d, i) => (
                <tr key={d} className={i === day ? 'bg-secondary' : ''}>
                  <td className="py-1 pr-3 w-12">{d}</td>
                  <td className="py-1">{space.hoursKnown === false ? 'Not listed' : fmtRange(space.hours[i])}</td>
                  <td className="py-1 text-right text-muted-foreground">
                    {space.hoursKnown === false
                      ? 'ask the owner'
                      : space.hours[i]
                        ? `free before ${fmtHour(space.hours[i]![0])} & after ${fmtHour(space.hours[i]![1])}`
                        : 'free all day'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="rule mt-5 pb-1 font-mono text-xs uppercase tracking-wider">Inside</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {space.photos.length ? (
              space.photos.map((p) => (
                <a key={p} href={photoUrl(p, 1600)} target="_blank" rel="noreferrer">
                  <img
                    src={photoUrl(p, 480)}
                    alt={`Inside ${space.name}`}
                    loading="lazy"
                    className="aspect-square w-full object-cover rounded-[var(--radius)] border border-border bg-muted"
                  />
                </a>
              ))
            ) : (
              <div className="col-span-3 flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-input rounded-[var(--radius)] p-3">
                <Camera className="w-4 h-4" />
                {space.sample ? <>Photos arrive with the <Link to="/data" className="underline">Google pull</Link>.</> : 'No photos on Google for this one.'}
              </div>
            )}
          </div>

          <h2 className="rule mt-5 pb-1 font-mono text-xs uppercase tracking-wider">Reach</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {space.contactName && (
              <li className="flex items-center gap-2"><Avatar name={space.contactName} /> {space.contactName}, owner</li>
            )}
            {space.phone && <li className="flex items-center gap-2"><Phone className="w-4 h-4" /><a href={`tel:${space.phone}`} className="underline">{space.phone}</a></li>}
            {space.email && <li className="flex items-center gap-2"><Mail className="w-4 h-4" /><a href={`mailto:${space.email}`} className="underline">{space.email}</a></li>}
            {space.website && <li className="flex items-center gap-2"><Globe className="w-4 h-4" /><a href={space.website} target="_blank" rel="noreferrer" className="underline break-all">{space.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a></li>}
            {space.mapsUri && <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /><a href={space.mapsUri} target="_blank" rel="noreferrer" className="underline">Open in Google Maps</a></li>}
          </ul>

          {space.placeId && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 -ml-2 text-muted-foreground"
              onClick={() => { toggleHidden(space.id); navigate('/') }}
            >
              <EyeOff className="w-4 h-4" /> Hide from the map — chain or not a fit
            </Button>
          )}

          {here.length > 0 && (
            <>
              <h2 className="rule mt-5 pb-1 font-mono text-xs uppercase tracking-wider">Who's asked</h2>
              <ul className="mt-2 space-y-2">
                {here.map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-sm">
                    <Avatar name={a.from} />
                    <div>
                      <span className="font-semibold">{a.from}</span> · {DAYS[a.day]} {fmtHour(a.start)}–{fmtHour(a.end)} · {a.what}
                      <div className="font-mono text-xs">
                        {a.status === 'yes' && <span className="bg-accent px-1">yes{a.reply ? ` — "${a.reply}"` : ''}</span>}
                        {a.status === 'no' && <span className="text-muted-foreground">not this time{a.reply ? ` — "${a.reply}"` : ''}</span>}
                        {a.status === 'sent' && <span className="text-muted-foreground">waiting on the owner</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <AskForm key={space.id} space={space} />
      </div>
    </div>
  )
}