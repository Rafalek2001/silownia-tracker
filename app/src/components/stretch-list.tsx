import { useEffect, useState } from "react"
import { Check, Play } from "lucide-react"
import type { Stretch } from "@/lib/plan"
import { cn } from "@/lib/utils"

interface StretchListProps {
  stretches: Stretch[]
  done: number[] // rounds done per stretch
  onChange: (done: number[]) => void
}

/** Tap a stretch to start its hold timer; each finished hold counts one round. */
export function StretchList({ stretches, done, onChange }: StretchListProps) {
  const [running, setRunning] = useState<{ i: number; endAt: number } | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [running])

  const left = running ? Math.max(0, Math.ceil((running.endAt - now) / 1000)) : 0
  useEffect(() => {
    if (running && left === 0) {
      onChange(stretches.map((s, j) => (j === running.i ? Math.min(s.rounds, (done[j] ?? 0) + 1) : done[j] ?? 0)))
      navigator.vibrate?.(200)
      setRunning(null)
    }
  }, [left, running]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Rozciąganie</h2>
        <p className="text-sm text-muted-foreground">
          Dotknij pozycję, żeby odliczyć {stretches[0]?.seconds ?? 40} s. Spokojnie, bez bólu, każda strona osobno.
        </p>
      </div>
      <ul className="space-y-2">
        {stretches.map((s, i) => {
          const rounds = done[i] ?? 0
          const complete = rounds >= s.rounds
          const isRunning = running?.i === i
          return (
            <li key={i}>
              <button
                onClick={() => setRunning(isRunning ? null : { i, endAt: Date.now() + s.seconds * 1000 })}
                className={cn(
                  "relative flex min-h-14 w-full items-center gap-3 overflow-hidden rounded-xl border bg-card px-4 py-3 text-left",
                  complete && "text-muted-foreground",
                )}
              >
                {isRunning && (
                  <span
                    className="absolute inset-y-0 left-0 bg-primary/15 transition-[width] duration-200 ease-linear"
                    style={{ width: `${((s.seconds - left) / s.seconds) * 100}%` }}
                  />
                )}
                <span
                  className={cn(
                    "relative flex size-8 shrink-0 items-center justify-center rounded-full border",
                    complete && "border-transparent bg-primary text-primary-foreground",
                  )}
                >
                  {complete ? <Check className="size-4" /> : isRunning ? <span className="font-mono text-xs">{left}</span> : <Play className="size-3.5" />}
                </span>
                <span className="relative flex-1 text-sm font-medium">{s.name}</span>
                <span className="relative font-mono text-xs text-muted-foreground">
                  {rounds}/{s.rounds}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
