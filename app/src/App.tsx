import { useEffect, useState } from "react"
import { ClipboardList, Dumbbell, Settings, TrendingUp } from "lucide-react"
import { ThemeProvider, useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { ConfirmProvider } from "@/components/confirm-dialog"
import { HistoryView } from "@/components/history-view"
import { ProgressView } from "@/components/progress-view"
import { RestTimerButton, TimerProvider, useRestTimer } from "@/components/rest-timer"
import { SessionView } from "@/components/session-view"
import { SettingsDrawer } from "@/components/settings-drawer"
import { TodayView } from "@/components/today-view"
import { useGymStore } from "@/hooks/use-gym-store"
import { cn } from "@/lib/utils"

type View = "today" | "history" | "progress"

const NAV: { view: View; label: string; icon: typeof Dumbbell }[] = [
  { view: "today", label: "Dziś", icon: Dumbbell },
  { view: "history", label: "Historia", icon: ClipboardList },
  { view: "progress", label: "Progres", icon: TrendingUp },
]

const TITLES: Record<View, string> = { today: "Dziś", history: "Historia", progress: "Progres" }

function GymTracker() {
  const store = useGymStore()
  const [view, setView] = useState<View>("today")
  const [inSession, setInSession] = useState(() => !!store.session) // reopening the app mid-workout goes straight back
  const [settings, setSettings] = useState(false)
  const { resolvedTheme } = useTheme()
  const timer = useRestTimer()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view, inSession])
  // keep the browser chrome in step with the in-app theme, not just the OS one
  useEffect(() => {
    const color = resolvedTheme === "dark" ? "#0b0b0c" : "#fafafa"
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", color))
  }, [resolvedTheme])

  if (inSession && store.session)
    return (
      <div className="mx-auto max-w-lg">
        <SessionView
          store={store}
          onExit={() => setInSession(false)}
          onFinished={(saved) => {
            setInSession(false)
            setView(saved ? "history" : "today")
            if (saved) toast.success("Trening zapisany", { description: "Dobra robota. Do zobaczenia za kilka dni." })
          }}
        />
      </div>
    )

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between px-4 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div>
          <p className="text-xs font-medium text-muted-foreground">GymTracker</p>
          <h1 className="text-2xl font-semibold tracking-tight">{TITLES[view]}</h1>
        </div>
        <Button variant="ghost" size="icon" className="size-11 text-muted-foreground" aria-label="Ustawienia" onClick={() => setSettings(true)}>
          <Settings className="size-5" />
        </Button>
      </header>

      <main className="px-4">
        {view === "today" && <TodayView store={store} onOpenSession={() => setInSession(true)} />}
        {view === "history" && <HistoryView store={store} />}
        {view === "progress" && <ProgressView store={store} />}
      </main>

      {timer.running && view !== "today" && <RestTimerButton />}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/85 pb-safe backdrop-blur-lg">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {NAV.map(({ view: v, label, icon: Icon }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-current={view === v ? "page" : undefined}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                view === v ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5", view === v && "text-primary")} strokeWidth={view === v ? 2.25 : 1.75} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <SettingsDrawer open={settings} onClose={() => setSettings(false)} store={store} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="gt-theme" disableTransitionOnChange>
      <ConfirmProvider>
        <TimerProvider>
          <GymTracker />
          <Toaster position="top-center" offset="calc(env(safe-area-inset-top) + 12px)" />
        </TimerProvider>
      </ConfirmProvider>
    </ThemeProvider>
  )
}
