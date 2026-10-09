// SF Assessor Secured Property Tax Rolls (DataSF, keyless, CORS-open).
// Finds the parcel under each storefront and estimates the ground-floor footage.
import type { Space } from '@/data/spaces'

const BASE = 'https://data.sfgov.org/resource/wv5m-vpq2.json'
const SELECT = 'property_area,number_of_stories,number_of_units,use_definition,closed_roll_year,property_location'

interface Row {
  property_area?: string
  number_of_stories?: string
  number_of_units?: string
  use_definition?: string
  closed_roll_year?: string
  property_location?: string
}

async function rows(where: string): Promise<Row[]> {
  const url = `${BASE}?$select=${SELECT}&$where=${encodeURIComponent(where)}&$order=closed_roll_year%20DESC&$limit=40`
  const res = await fetch(url)
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

export interface Footage {
  sqft: number | null
  source: string
}

export async function lookupFootage(s: Space): Promise<Footage> {
  let found: Row[] = []
  try {
    found = await rows(`within_circle(the_geom, ${s.lat}, ${s.lng}, 25)`)
  } catch {
    found = []
  }
  if (!found.length) {
    // Fallback: match the assessor's padded "0000 1234 IRVING" location string
    const m = /^(\d+)[A-Za-z]?\s+(.+?)\s+(St|Ave|Blvd|Way|Dr|Ter|Ln|Ct)\b/i.exec(s.address)
    if (m) {
      const num = m[1].padStart(4, '0')
      const street = m[2].toUpperCase().replace(/^(\d)(ST|ND|RD|TH)$/, '0$1$2')
      try {
        found = await rows(`property_location like '%${num} ${street}%'`)
      } catch {
        found = []
      }
    }
  }
  if (!found.length) return { sqft: null, source: 'No assessor match' }

  const year = found[0].closed_roll_year
  const latest = found.filter((r) => r.closed_roll_year === year && Number(r.property_area) > 0)
  if (!latest.length) return { sqft: null, source: `Assessor roll ${year}: no area on file` }

  const commercial = latest.find((r) => /commercial|retail|store|office|industrial|restaurant/i.test(r.use_definition ?? ''))
  const pick = commercial ?? latest.reduce((m, r) => (Number(r.property_area) > Number(m.property_area) ? r : m))
  const area = Math.round(Number(pick.property_area))
  const stories = Math.max(1, Math.round(Number(pick.number_of_stories) || 1))

  if (commercial && stories === 1) return { sqft: area, source: `Assessor roll ${year} (commercial parcel)` }
  return {
    sqft: Math.round(area / stories),
    source: `Assessor estimate: ${area.toLocaleString()} sq ft building ÷ ${stories} floor${stories === 1 ? '' : 's'}`,
  }
}

export async function lookupAll(
  spaces: Space[],
  onEach: (id: string, f: Footage, count: number) => void,
  concurrency = 5,
) {
  let i = 0
  let count = 0
  const worker = async () => {
    while (i < spaces.length) {
      const s = spaces[i++]
      const f = await lookupFootage(s)
      onEach(s.id, f, ++count)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, spaces.length) }, worker))
}