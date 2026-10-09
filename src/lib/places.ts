// Google Places API (New) importer — runs in the browser with a referrer-restricted key.
// Google's policy: place IDs may be kept indefinitely, other fields up to 30 days — re-pull monthly.
// Photos are never stored; they load live through photoUrl().
import { env } from '@/env'
import type { Range, Space, SpaceType } from '@/data/spaces'

export const PLACES_KEY: string = (env as Record<string, string | undefined>).GOOGLE_MAPS_API_KEY ?? ''
export const hasKey = () => PLACES_KEY.length > 0

export const SUNSET_BOUNDS = {
  low: { latitude: 37.7335, longitude: -122.5105 },
  high: { latitude: 37.7668, longitude: -122.4535 },
}
const INNER_EDGE_LNG = -122.4762 // 19th Ave — east of it is Inner Sunset

const FIELDS = [
  'places.id', 'places.displayName', 'places.shortFormattedAddress', 'places.formattedAddress',
  'places.location', 'places.primaryType', 'places.types', 'places.regularOpeningHours',
  'places.nationalPhoneNumber', 'places.websiteUri', 'places.googleMapsUri', 'places.photos',
  'places.businessStatus', 'nextPageToken',
].join(',')

// One Text Search per Google place type (Table A), up to 3 pages of 20 each.
const QUERIES: { type: string; kind: SpaceType; q: string }[] = [
  { type: 'cafe', kind: 'cafe', q: 'cafe' },
  { type: 'coffee_shop', kind: 'cafe', q: 'coffee shop' },
  { type: 'bakery', kind: 'cafe', q: 'bakery' },
  { type: 'restaurant', kind: 'food', q: 'restaurant' },
  { type: 'bar', kind: 'food', q: 'bar' },
  { type: 'book_store', kind: 'retail', q: 'bookstore' },
  { type: 'clothing_store', kind: 'retail', q: 'clothing store' },
  { type: 'gift_shop', kind: 'retail', q: 'gift shop' },
  { type: 'florist', kind: 'retail', q: 'florist' },
  { type: 'hardware_store', kind: 'retail', q: 'hardware store' },
  { type: 'pet_store', kind: 'retail', q: 'pet store' },
  { type: 'bicycle_store', kind: 'retail', q: 'bike shop' },
  { type: 'home_goods_store', kind: 'retail', q: 'home goods store' },
  { type: 'gym', kind: 'studio', q: 'gym' },
  { type: 'yoga_studio', kind: 'studio', q: 'yoga studio' },
  { type: 'art_gallery', kind: 'gallery', q: 'art gallery' },
  { type: 'beauty_salon', kind: 'service', q: 'beauty salon' },
  { type: 'hair_salon', kind: 'service', q: 'hair salon' },
  { type: 'barber_shop', kind: 'service', q: 'barber' },
]

// Formula retail (SF's 11+ locations rule) — obvious nationals plus big regionals.
// Anything that slips through can be hidden from its detail page.
const CHAINS =
  /\b(starbucks|peet'?s|philz|blue bottle|subway|chipotle|mcdonald|burger king|taco bell|kfc|popeyes|wingstop|domino|pizza hut|papa john|panda express|jamba|baskin|dunkin|safeway|whole foods|trader joe|walgreens|cvs|rite aid|7-eleven|target|ross|marshalls|t-mobile|verizon|at&t|bank of america|wells fargo|chase bank|citibank|crunch fitness|24 hour fitness|orangetheory|f45|supercuts|great clips|european wax|drybar|boba guys|halal guys|ike'?s|sweetgreen|mixt)\b/i

export interface ImportProgress {
  stage: 'places' | 'assessor'
  done: number
  total: number
  note: string
}

async function textSearch(body: Record<string, unknown>) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_KEY,
      'X-Goog-FieldMask': FIELDS,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text.slice(0, 180)}`)
  }
  return res.json()
}

function toHours(oh: any): { hours: Range[]; known: boolean } {
  const periods: any[] = oh?.periods ?? []
  const out: Range[] = [null, null, null, null, null, null, null]
  if (!periods.length) return { hours: out, known: false }
  if (periods.length === 1 && !periods[0].close) {
    return { hours: out.map(() => [0, 24] as [number, number]), known: true } // open 24h
  }
  for (const p of periods) {
    const d: number | undefined = p.open?.day
    if (d == null) continue
    const start = (p.open.hour ?? 0) + (p.open.minute ?? 0) / 60
    let end = 24
    if (p.close) {
      const ce = (p.close.hour ?? 0) + (p.close.minute ?? 0) / 60
      end = p.close.day === d ? ce : 24 // closes after midnight → treat as midnight
    }
    const cur = out[d]
    out[d] = cur ? [Math.min(cur[0], start), Math.max(cur[1], end)] : [start, end]
  }
  return { hours: out, known: true }
}

function kindOf(primary: string | undefined, types: string[], fallback: SpaceType): SpaceType {
  const all = [primary, ...types].filter(Boolean) as string[]
  const has = (re: RegExp) => all.some((t) => re.test(t))
  if (has(/cafe|coffee|bakery|tea_house|dessert|ice_cream|donut|bagel/)) return 'cafe'
  if (has(/restaurant|^bar$|wine_bar|pub|meal_|sandwich|pizza|ramen|sushi|taco|brunch/)) return 'food'
  if (has(/gym|fitness|yoga|pilates|dance|martial/)) return 'studio'
  if (has(/gallery|art_studio|museum/)) return 'gallery'
  if (has(/salon|barber|spa|massage|tattoo|nail|beauty/)) return 'service'
  if (has(/store|shop|florist|market|boutique/)) return 'retail'
  return fallback
}

function toSpace(p: any, fallback: SpaceType): Space | null {
  if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') return null
  const name: string = p.displayName?.text ?? ''
  const lat = p.location?.latitude
  const lng = p.location?.longitude
  if (!name || lat == null || lng == null) return null
  const { hours, known } = toHours(p.regularOpeningHours)
  const raw: string = p.shortFormattedAddress ?? p.formattedAddress ?? ''
  return {
    id: p.id,
    placeId: p.id,
    name,
    type: kindOf(p.primaryType, p.types ?? [], fallback),
    area: lng > INNER_EDGE_LNG ? 'Inner Sunset' : 'Outer Sunset',
    address: raw.replace(/,\s*San Francisco.*$/i, ''),
    lat,
    lng,
    hours,
    hoursKnown: known,
    sqft: null,
    sqftSource: 'Looking up…',
    phone: p.nationalPhoneNumber || undefined,
    website: p.websiteUri || undefined,
    mapsUri: p.googleMapsUri || undefined,
    photos: ((p.photos ?? []) as any[]).slice(0, 6).map((ph) => ph.name as string),
  }
}

export interface ImportResult {
  spaces: Space[]
  skipped: string[] // chain names left out
  errors: string[]
}

export async function importPlaces(onProgress: (p: ImportProgress) => void): Promise<ImportResult> {
  if (!hasKey()) throw new Error('Add GOOGLE_MAPS_API_KEY in the Env tab first.')
  const seen = new Map<string, Space>()
  const skipped = new Set<string>()
  const errors: string[] = []

  for (let i = 0; i < QUERIES.length; i++) {
    const q = QUERIES[i]
    onProgress({ stage: 'places', done: i, total: QUERIES.length, note: `Looking for ${q.q}s… ${seen.size} found so far` })
    let pageToken: string | undefined
    for (let page = 0; page < 3; page++) {
      let data: any
      try {
        data = await textSearch({
          textQuery: `${q.q} in the Sunset District, San Francisco`,
          includedType: q.type,
          locationRestriction: { rectangle: SUNSET_BOUNDS },
          pageSize: 20,
          pageToken,
        })
      } catch (e) {
        errors.push(`${q.q}: ${(e as Error).message}`)
        break
      }
      for (const p of data.places ?? []) {
        if (seen.has(p.id)) continue
        const name = p.displayName?.text ?? ''
        if (CHAINS.test(name)) {
          skipped.add(name)
          continue
        }
        const s = toSpace(p, q.kind)
        if (s) seen.set(s.id, s)
      }
      pageToken = data.nextPageToken
      if (!pageToken) break
    }
  }

  const spaces = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
  return { spaces, skipped: [...skipped].sort(), errors }
}

export function photoUrl(name: string, maxWidthPx = 640) {
  return `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidthPx}&key=${PLACES_KEY}`
}