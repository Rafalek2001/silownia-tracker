import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const ITEM_H = 36
const VISIBLE = 3 // odd: selected row sits in the middle
const KEY_STEPS: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -10, PageDown: 10 }

interface DrumPickerProps {
  options: string[] // "" means "not set" and renders as —
  value: string
  onChange: (v: string) => void
  label: string
  hint?: string
  className?: string
}

/**
 * Vertical wheel picker. Pointer events cover touch, pen and mouse; the mouse
 * wheel and arrow keys work too.
 */
export function DrumPicker({ options, value, onChange, label, hint, className }: DrumPickerProps) {
  const found = options.indexOf(value)
  const idx = found < 0 ? 0 : found
  const [drag, setDrag] = useState<number | null>(null) // fractional index while dragging
  const [animate, setAnimate] = useState(false)
  const g = useRef({ y0: 0, i0: 0, moved: false, pts: [] as { t: number; y: number }[] })
  const wheelAcc = useRef(0)
  const elRef = useRef<HTMLDivElement>(null)

  const hi = options.length - 1
  const clamp = (n: number) => Math.max(0, Math.min(hi, n))
  const commit = (n: number) => {
    setAnimate(true)
    setDrag(null)
    const next = clamp(n)
    if (next !== idx) onChange(options[next])
  }

  // Non-passive wheel listener so the page doesn't scroll while picking.
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      wheelAcc.current += e.deltaY
      const steps = Math.trunc(wheelAcc.current / 40)
      if (steps) {
        wheelAcc.current -= steps * 40
        el.dispatchEvent(new CustomEvent("drum-step", { detail: steps }))
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const onStep = (e: Event) => commit(idx + (e as CustomEvent<number>).detail)
    el.addEventListener("drum-step", onStep)
    return () => el.removeEventListener("drum-step", onStep)
  })

  const pos = drag ?? idx
  const y = (Math.floor(VISIBLE / 2) - pos) * ITEM_H

  return (
    <div className={cn("flex min-w-0 flex-col items-center gap-1", className)}>
      <div
        ref={elRef}
        role="spinbutton"
        aria-label={label}
        aria-valuetext={options[idx] || "brak"}
        tabIndex={0}
        className="relative w-full touch-none select-none overflow-hidden rounded-lg bg-muted/60 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ height: ITEM_H * VISIBLE }}
        onKeyDown={(e) => {
          const step = KEY_STEPS[e.key]
          if (!step) return
          e.preventDefault()
          commit(idx + step)
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          g.current = { y0: e.clientY, i0: idx, moved: false, pts: [{ t: e.timeStamp, y: e.clientY }] }
          setAnimate(false)
          setDrag(idx)
        }}
        onPointerMove={(e) => {
          if (drag === null) return
          const s = g.current
          s.pts.push({ t: e.timeStamp, y: e.clientY })
          while (s.pts.length > 2 && s.pts[0].t < e.timeStamp - 80) s.pts.shift()
          if (Math.abs(e.clientY - s.y0) > 3) s.moved = true
          let raw = s.i0 - (e.clientY - s.y0) / ITEM_H
          if (raw < 0) raw = -Math.sqrt(-raw) * 0.4 // rubber band at the ends
          if (raw > hi) raw = hi + Math.sqrt(raw - hi) * 0.4
          setDrag(raw)
        }}
        onPointerUp={(e) => {
          if (drag === null) return
          const s = g.current
          if (!s.moved) {
            // tap: move toward the tapped row
            const rel = e.clientY - e.currentTarget.getBoundingClientRect().top
            return commit(idx + Math.floor(rel / ITEM_H) - Math.floor(VISIBLE / 2))
          }
          const f = s.pts[0]
          const dt = e.timeStamp - f.t
          const vel = dt > 5 ? (e.clientY - f.y) / dt : 0 // px/ms
          const big = options.length > 60
          const fling = Math.max(-(big ? 14 : 6), Math.min(big ? 14 : 6, -vel * (big ? 9 : 4)))
          commit(Math.round(drag + fling))
        }}
        onPointerCancel={() => commit(Math.round(drag ?? idx))}
      >
        {/* selection band */}
        <div
          className="pointer-events-none absolute inset-x-1 rounded-md border border-border bg-background shadow-sm"
          style={{ top: ITEM_H * Math.floor(VISIBLE / 2), height: ITEM_H }}
        />
        <div
          className={cn("relative will-change-transform", animate && "transition-transform duration-300 ease-out")}
          style={{ transform: `translateY(${y}px)` }}
        >
          {options.map((o, i) => {
            const d = Math.abs(i - pos)
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-center font-mono text-base tabular transition-[color,opacity]",
                  d < 0.5 ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
                style={{ height: ITEM_H, opacity: d < 0.5 ? 1 : d < 1.5 ? 0.55 : 0.2 }}
              >
                {o === "" ? "—" : o}
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex h-4 items-baseline gap-1.5 text-[11px] leading-none">
        <span className="font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {hint && <span className="font-mono text-muted-foreground/70">{hint}</span>}
      </div>
    </div>
  )
}

export const REPS_OPTIONS = ["", ...Array.from({ length: 50 }, (_, i) => String(i + 1))]
export const KG_OPTIONS = ["", ...Array.from({ length: 401 }, (_, i) => String(i / 2))]
