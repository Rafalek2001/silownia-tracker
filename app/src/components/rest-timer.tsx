import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { Timer, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const PRESETS = [60, 90, 120, 180]

interface TimerApi {
  /** `key` ties the rest to an exercise, so adjustments can be remembered. */
  start: (seconds: number, key?: string) => void
  stop: () => void
  /** Adds (or with a negative value removes) time; returns the new planned length. */
  add: (seconds: number) => { planned: number; key?: string }
  left: number
  planned: number
  running: boolean
}

const TimerContext = createContext<TimerApi>({
  start: () => {},
  stop: () => {},
  add: () => ({ planned: 0 }),
  left: 0,
  planned: 0,
  running: false,
})
export const useRestTimer = () => useContext(TimerContext)
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

/** Rest timer state, based on wall-clock time so it stays right if the phone throttles the tab. */
export function TimerProvider({ children }: { children: ReactNode }) {
  const [endAt, setEndAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [planned, setPlanned] = useState(0)
  const meta = useRef<{ key?: string; planned: number }>({ planned: 0 })
  const done = useRef(false)

  useEffect(() => {
    if (endAt === null) return
    done.current = false
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endAt])

  const left = endAt === null ? 0 : Math.max(0, Math.ceil((endAt - now) / 1000))
  useEffect(() => {
    if (endAt !== null && left === 0 && !done.current) {
      done.current = true
      setEndAt(null)
      toast.success("Przerwa skończona", { description: "Czas na serię." })
      navigator.vibrate?.([200, 100, 200, 100, 400])
    }
  }, [left, endAt])

  const start = useCallback((s: number, key?: string) => {
    meta.current = { key, planned: s }
    setPlanned(s)
    setNow(Date.now())
    setEndAt(Date.now() + s * 1000)
  }, [])
  const stop = useCallback(() => setEndAt(null), [])
  const add = useCallback((s: number) => {
    const m = meta.current
    const next = Math.max(15, m.planned + s)
    const delta = next - m.planned
    m.planned = next
    setPlanned(next)
    setNow(Date.now())
    setEndAt((e) => (e === null ? e : Math.max(Date.now() + 1000, e + delta * 1000)))
    return { planned: next, key: m.key }
  }, [])

  return (
    <TimerContext.Provider value={{ start, stop, add, left, planned, running: endAt !== null }}>{children}</TimerContext.Provider>
  )
}

/** Floating button above the bottom nav: pick a preset, or tap the countdown to stop it. */
export function RestTimerButton({ className }: { className?: string }) {
  const { start, stop, left, running } = useRestTimer()
  const [open, setOpen] = useState(false)
  const pos = "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40"

  if (running)
    return (
      <Button
        onClick={stop}
        aria-label={`Zatrzymaj timer, zostało ${mmss(left)}`}
        className={cn(pos, "h-12 gap-1.5 rounded-full px-4 font-mono text-base tabular shadow-lg", left <= 10 && "animate-pulse", className)}
      >
        {mmss(left)}
        <X className="opacity-70" />
      </Button>
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Timer odpoczynku"
          className={cn(pos, "size-12 rounded-full bg-card shadow-lg [&_svg]:size-5", className)}
        >
          <Timer />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-auto p-1.5">
        <div className="flex flex-col gap-1">
          {PRESETS.map((s) => (
            <Button
              key={s}
              variant="ghost"
              className="h-11 justify-start px-4 font-mono text-base"
              onClick={() => {
                start(s)
                setOpen(false)
              }}
            >
              {mmss(s)}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
