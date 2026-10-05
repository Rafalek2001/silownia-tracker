import { useRef } from "react"
import { Download, Monitor, Moon, RotateCcw, Sun, Upload } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useConfirm } from "@/components/confirm-dialog"
import type { GymStore } from "@/hooks/use-gym-store"
import { exportData, plural, type HistoryEntry } from "@/lib/storage"
import { cn } from "@/lib/utils"

const THEMES = [
  { value: "light", label: "Jasny", icon: Sun },
  { value: "dark", label: "Ciemny", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
]

export function SettingsDrawer({ open, onClose, store }: { open: boolean; onClose: () => void; store: GymStore }) {
  const { theme = "system", setTheme } = useTheme()
  const confirm = useConfirm()
  const fileRef = useRef<HTMLInputElement>(null)

  const importFile = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      const entries: HistoryEntry[] = Array.isArray(data) ? data : data.history
      if (!Array.isArray(entries) || !entries.every((e) => e.iso && Array.isArray(e.exs))) throw new Error("format")
      const ok = await confirm({
        title: `Zaimportować ${plural(entries.length, ["trening", "treningi", "treningów"])}?`,
        description: "Obecna historia w tej przeglądarce zostanie zastąpiona.",
        confirmLabel: "Importuj",
      })
      if (!ok) return
      store.importHistory(entries)
      toast.success("Historia zaimportowana")
      onClose()
    } catch {
      toast.error("To nie jest plik eksportu GymTrackera")
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} shouldScaleBackground={false}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Ustawienia</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Motyw</h3>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm",
                    theme === value ? "bg-background font-medium shadow-sm" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dane</h3>
            <Button
              variant="outline"
              className="h-12 w-full justify-start"
              onClick={() => {
                exportData(store.workouts, store.history)
                toast.success("Dane wyeksportowane")
              }}
            >
              <Download /> Eksportuj historię (JSON)
            </Button>
            <Button variant="outline" className="h-12 w-full justify-start" onClick={() => fileRef.current?.click()}>
              <Upload /> Importuj z pliku eksportu
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ""
                if (f) importFile(f)
              }}
            />
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan</h3>
            <Button
              variant="ghost"
              className="h-12 w-full justify-start text-muted-foreground"
              disabled={!!store.session}
              onClick={async () => {
                if (
                  await confirm({
                    title: "Przywrócić domyślny plan?",
                    description: "Wymienione ćwiczenia wrócą do planu startowego. Historia zostaje.",
                    confirmLabel: "Przywróć",
                  })
                ) {
                  store.resetPlan()
                  toast("Plan przywrócony")
                }
              }}
            >
              <RotateCcw /> Przywróć domyślny plan
            </Button>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
