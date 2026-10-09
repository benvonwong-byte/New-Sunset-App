// SAMPLE spaces — placeholders with plausible Sunset blocks, not real businesses.
// They show until the first pull on the Data page replaces them with real ones.

export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export type SpaceType = 'cafe' | 'food' | 'retail' | 'studio' | 'gallery' | 'service'
export type Area = 'Inner Sunset' | 'Outer Sunset'
export type Range = [number, number] | null // decimal hours; null = closed that day

export interface Space {
  id: string
  name: string
  type: SpaceType
  area: Area
  address: string
  lat: number
  lng: number
  hours: Range[] // indexed Sun..Sat
  sqft: number | null
  sqftSource: string
  contactName?: string
  phone?: string
  email?: string
  website?: string
  mapsUri?: string
  note?: string
  photos: string[] // Google Places photo resource names — see photoUrl() in lib/places
  hoursKnown?: boolean // false when Google lists no hours
  placeId?: string
  sample?: boolean
}

export interface Ask {
  id: string
  spaceId: string
  from: string
  day: Day
  start: number
  end: number
  what: string
  people: number
  status: 'sent' | 'yes' | 'no'
  reply?: string
  createdAt: string
}

export const TYPE_META: Record<SpaceType, { label: string; svg: string }> = {
  cafe: { label: 'Café', svg: '<path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/><path d="M7 3v2M11 3v2"/>' },
  food: { label: 'Restaurant', svg: '<path d="M7 3v18"/><path d="M5 3v5a2 2 0 0 0 4 0V3"/><path d="M17 3c-2 1-3 3-3 6v3h3v9"/>' },
  retail: { label: 'Shop', svg: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>' },
  studio: { label: 'Studio', svg: '<circle cx="12" cy="5" r="2"/><path d="M12 7v7"/><path d="M6 11l6 3 6-3"/><path d="M9 21l3-7 3 7"/>' },
  gallery: { label: 'Gallery', svg: '<rect x="4" y="5" width="16" height="14" rx="1"/><path d="M4 16l4-4 4 4 3-3 5 5"/><circle cx="16" cy="9" r="1.5"/>' },
  service: { label: 'Salon / service', svg: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9"/><path d="M14.5 14.5L20 20"/><path d="M8.1 8.1L12 12"/>' },
}

export const TYPES = Object.keys(TYPE_META) as SpaceType[]

const weekdays = (r: Range, weekend: Range): Range[] => [weekend, r, r, r, r, r, weekend]

export const SPACES: Space[] = [
  {
    id: 'fogline-cafe', name: 'Fogline Café', type: 'cafe', area: 'Inner Sunset',
    address: 'Irving St near 9th Ave', lat: 37.7640, lng: -122.4663,
    hours: [[8, 15], [7, 15], [7, 15], [7, 15], [7, 15], [7, 15], [8, 15]],
    sqft: 950, sqftSource: 'Assessor footprint',
    contactName: 'Mei', phone: '415-555-0142', email: 'hello@fogline.example',
    note: 'Long communal table, big front window, back room with a sink.',
    photos: [], sample: true,
  },
  {
    id: 'judah-books', name: 'Judah Street Books', type: 'retail', area: 'Outer Sunset',
    address: 'Judah St near 44th Ave', lat: 37.7607, lng: -122.5036,
    hours: [[11, 18], null, [11, 18], [11, 18], [11, 18], [11, 18], [11, 18]],
    sqft: 1200, sqftSource: 'Assessor footprint',
    phone: '415-555-0177', note: 'Reading nook in back; folding chairs for ~20.',
    photos: [], sample: true,
  },
  {
    id: 'noriega-movement', name: 'Noriega Movement Studio', type: 'studio', area: 'Outer Sunset',
    address: 'Noriega St near 30th Ave', lat: 37.7540, lng: -122.4882,
    hours: weekdays([16, 21], [8, 12]),
    sqft: 1800, sqftSource: 'Owner',
    phone: '415-555-0119', website: 'https://example.com',
    note: 'Sprung floor, mirrors, dimmable lights. Shoes off.',
    photos: [], sample: true,
  },
  {
    id: 'taraval-dumpling', name: 'Taraval Dumpling Kitchen', type: 'food', area: 'Outer Sunset',
    address: 'Taraval St near 22nd Ave', lat: 37.7431, lng: -122.4790,
    hours: [[11, 21], [11, 21], null, [11, 21], [11, 21], [11, 21], [11, 21]],
    sqft: 1400, sqftSource: 'Assessor footprint',
    phone: '415-555-0163', note: 'Eight tables; full kitchen; closed Tuesdays.',
    photos: [], sample: true,
  },
  {
    id: 'twentieth-frame', name: '20th Ave Frame & Gallery', type: 'gallery', area: 'Inner Sunset',
    address: 'Irving St near 20th Ave', lat: 37.7637, lng: -122.4779,
    hours: [null, null, null, [12, 18], [12, 18], [12, 18], [12, 18]],
    sqft: 700, sqftSource: 'Estimate',
    email: 'frames@example.com', note: 'White walls, track lighting, no seating.',
    photos: [], sample: true,
  },
  {
    id: 'ninth-cycle', name: 'Ninth Ave Cycle Shop', type: 'retail', area: 'Inner Sunset',
    address: 'Judah St near 9th Ave', lat: 37.7623, lng: -122.4665,
    hours: [null, [10, 18], [10, 18], [10, 18], [10, 18], [10, 18], [10, 18]],
    sqft: 2100, sqftSource: 'Assessor footprint',
    phone: '415-555-0188', note: 'Open floor once the bikes roll to the wall; roll-up door.',
    photos: [], sample: true,
  },
]

export const SEED_ASKS: Ask[] = [
  {
    id: 'ask-seed-1', spaceId: 'fogline-cafe', from: 'Von', day: 2, start: 18, end: 20,
    what: 'Free tea ceremony for 8 neighbors', people: 8, status: 'yes',
    reply: "Yes — back door's on Irving. I'll leave the kettle out.",
    createdAt: '2025-10-06T18:00:00Z',
  },
]

export const STEWARD = { name: 'Von', line: 'keeps this map — say hi' }

export function fmtHour(h: number) {
  const hh = Math.floor(h) % 24
  const m = Math.round((h % 1) * 60)
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  const ampm = hh >= 12 ? 'PM' : 'AM'
  return m ? `${h12}:${String(m).padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`
}

export function fmtRange(r: Range) {
  return r ? `${fmtHour(r[0])}–${fmtHour(r[1])}` : 'Closed'
}

export interface Status {
  free: boolean
  label: string
}

export function statusAt(space: Space, day: Day, hour: number): Status {
  if (space.hoursKnown === false) return { free: false, label: 'Hours not listed — ask' }
  const r = space.hours[day]
  if (!r) return { free: true, label: 'Closed today — free all day' }
  const [open, close] = r
  if (hour >= open && hour < close) return { free: false, label: `Open until ${fmtHour(close)}` }
  if (hour < open) return { free: true, label: `Free until ${fmtHour(open)}` }
  return { free: true, label: `Free after ${fmtHour(close)}` }
}

export function freeWindows(space: Space, day: Day): string[] {
  if (space.hoursKnown === false) return ['unknown']
  const r = space.hours[day]
  if (!r) return ['All day']
  const out: string[] = []
  if (r[0] > 9) out.push(`9 AM–${fmtHour(r[0])}`)
  if (r[1] < 24) out.push(`${fmtHour(r[1])}–12 AM`)
  return out.length ? out : ['None']
}

export type SizeBucket = 'small' | 'medium' | 'large' | 'unknown'
export const SIZE_LABEL: Record<SizeBucket, string> = {
  small: 'Under 800 sq ft',
  medium: '800–2,000 sq ft',
  large: '2,000+ sq ft',
  unknown: 'Size unknown',
}

export function sizeBucket(sqft: number | null): SizeBucket {
  if (sqft == null) return 'unknown'
  if (sqft < 800) return 'small'
  if (sqft < 2000) return 'medium'
  return 'large'
}