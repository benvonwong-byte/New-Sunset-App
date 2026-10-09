import { useEffect, useRef } from 'react'
import { TYPE_META, statusAt, type Space } from '@/data/spaces'
import { useStore } from '@/store'

declare const L: any

export default function SpaceMap({ spaces }: { spaces: Space[] }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const layer = useRef<any>(null)
  const day = useStore((s) => s.day)
  const hour = useStore((s) => s.hour)
  const selectedId = useStore((s) => s.selectedId)
  const select = useStore((s) => s.select)

  useEffect(() => {
    if (!el.current || map.current || typeof L === 'undefined') return
    map.current = L.map(el.current, { zoomControl: true, scrollWheelZoom: false }).setView([37.755, -122.485], 13)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current || !layer.current) return
    layer.current.clearLayers()
    spaces.forEach((s) => {
      const st = statusAt(s, day, hour)
      const cls = `pin ${st.free ? '' : 'busy'} ${selectedId === s.id ? 'selected' : ''}`
      const icon = L.divIcon({
        html: `<div class="${cls}" title="${s.name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TYPE_META[s.type].svg}</svg></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })
      L.marker([s.lat, s.lng], { icon })
        .addTo(layer.current)
        .on('click', () => select(s.id))
    })
  }, [spaces, day, hour, selectedId, select])

  return (
    <div
      ref={el}
      className="w-full h-[46vh] md:h-full min-h-[320px] rounded-[var(--radius)] border border-border overflow-hidden"
      role="region"
      aria-label="Map of spaces"
    />
  )
}