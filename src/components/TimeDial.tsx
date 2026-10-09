import { DAYS, DAY_LONG, fmtHour, type Day } from '@/data/spaces'
import { useStore } from '@/store'

export default function TimeDial() {
  const day = useStore((s) => s.day)
  const hour = useStore((s) => s.hour)
  const setWhen = useStore((s) => s.setWhen)

  return (
    <section className="bg-card border border-border rounded-[var(--radius)] p-3 md:p-4">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">When</span>
        <span className="font-display text-2xl leading-none">
          {DAY_LONG[day]} · {fmtHour(hour)}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-3">
        {DAYS.map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => setWhen(i as Day, hour)}
            aria-pressed={day === i}
            className={`h-11 font-mono text-sm rounded-[var(--radius)] border ${
              day === i
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-secondary'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="sr-only">Hour</span>
        <input
          type="range"
          min={9}
          max={24}
          step={0.5}
          value={hour}
          onChange={(e) => setWhen(day, Number(e.target.value))}
          className="w-full h-11"
        />
      </label>
      <div className="flex justify-between font-mono text-xs text-muted-foreground -mt-1">
        <span>9 AM</span>
        <span>Noon</span>
        <span>6 PM</span>
        <span>Midnight</span>
      </div>
    </section>
  )
}