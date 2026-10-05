import { useId, useMemo, useState } from "react"

interface LineChartProps {
  labels: string[]
  values: (number | null)[]
  color: string // CSS color, e.g. "hsl(var(--plan-a))"
  unit?: string
}

const W = 320
const H = 140
const PAD = { t: 12, r: 8, b: 22, l: 36 }

function niceTicks(min: number, max: number, count = 4) {
  if (min === max) {
    const d = Math.abs(min) * 0.1 || 1
    min -= d
    max += d
  }
  const raw = (max - min) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100)
  return ticks
}

/** Minimal SVG line chart. Colors come from theme tokens, so it follows light/dark mode. */
export function LineChart({ labels, values, color, unit }: LineChartProps) {
  const gid = useId()
  const [active, setActive] = useState<number | null>(null)

  const { pts, ticks, y } = useMemo(() => {
    const nums = values.filter((v): v is number => v !== null)
    const ticks = niceTicks(Math.min(...nums), Math.max(...nums))
    const lo = ticks[0]
    const hi = ticks[ticks.length - 1]
    const iw = W - PAD.l - PAD.r
    const ih = H - PAD.t - PAD.b
    const y = (v: number) => PAD.t + ih - ((v - lo) / (hi - lo || 1)) * ih
    const x = (i: number) => PAD.l + (values.length === 1 ? iw / 2 : (i / (values.length - 1)) * iw)
    const pts = values.map((v, i) => (v === null ? null : { x: x(i), y: y(v), v, i }))
    return { pts, ticks, y }
  }, [values])

  const real = pts.filter((p): p is NonNullable<typeof p> => p !== null)
  const line = real.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
  const area = real.length > 1 ? `${line} L${real[real.length - 1].x},${H - PAD.b} L${real[0].x},${H - PAD.b} Z` : ""
  const shown = active ?? real[real.length - 1]?.i
  const cur = pts[shown ?? -1]
  const labelEvery = Math.max(1, Math.ceil(labels.length / 4))

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-semibold tabular">{cur ? cur.v.toLocaleString("pl-PL") : "—"}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        {cur && <span className="ml-auto text-xs text-muted-foreground">{labels[cur.i]}</span>}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-pan-y select-none"
        role="img"
        aria-label={`Wykres: ${values.filter((v) => v !== null).join(", ")}`}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const px = ((e.clientX - r.left) / r.width) * W
          let best = real[0]
          for (const p of real) if (Math.abs(p.x - px) < Math.abs(best.x - px)) best = p
          if (best) setActive(best.i)
        }}
        onPointerLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="hsl(var(--chart-grid))" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
              {t.toLocaleString("pl-PL")}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i === labels.length - 1 || (i % labelEvery === 0 && labels.length - 1 - i >= labelEvery / 2) ? (
            <text
              key={i}
              x={pts[i]?.x ?? PAD.l + (i / Math.max(1, labels.length - 1)) * (W - PAD.l - PAD.r)}
              y={H - 6}
              textAnchor={labels.length === 1 ? "middle" : i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
              className="fill-muted-foreground text-[10px]"
            >
              {l.replace(/ \d{4}$/, "")}
            </text>
          ) : null,
        )}
        {area && <path d={area} fill={`url(#${gid})`} />}
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {cur && <line x1={cur.x} x2={cur.x} y1={PAD.t} y2={H - PAD.b} stroke={color} strokeOpacity="0.3" strokeDasharray="3 3" />}
        {real.map((p) => (
          <circle
            key={p.i}
            cx={p.x}
            cy={p.y}
            r={p.i === shown ? 4.5 : 3}
            fill={p.i === shown ? color : "hsl(var(--card))"}
            stroke={color}
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  )
}
