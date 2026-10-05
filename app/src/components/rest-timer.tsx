import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { Timer, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const PRESETS = [60, 90, 120, 180]

interface TimerApi {
  start: (seconds: number) => void
  stop: () => void
  left: number
  running: boolean
}

const TimerContext = createContext<TimerApi>({ start: () => {}, stop: () => {}, left: 0, running: false })
export const useRestTimer = () => useContext(TimerContext)
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

/** Rest timer state, based on wall-clock time so it stays right if the phone throttles the tab. */
export function TimerProvider({ children }: { children: ReactNode }) {
  const [endAt, setEndAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
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

  const start = useCallback((s: number) => {
    setNow(Date.now())
    setEndAt(Date.now() + s * 1000)
  }, [])
  const stop = useCallback(() => setEndAt(null), [])

  return (
    <TimerContext.Provider value={{ start, stop, left, running: endAt !== null }}>{children}</TimerContext.Provider>
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
