import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useConfirm } from "@/components/confirm-dialog"
import { EditDrawer } from "@/components/edit-drawer"
import type { GymStore } from "@/hooks/use-gym-store"
import { keyLabel, exerciseKey } from "@/lib/stats"
import { formatSet, isFilled, plural } from "@/lib/storage"
import { cn } from "@/lib/utils"

export function HistoryView({ store }: { store: GymStore }) {
  const [editing, setEditing] = useState<number | null>(null)
  const confirm = useConfirm()
  const entries = store.history.map((e, index) => ({ e, index }))

  const remove = async (index: number) => {
    const ok = await confirm({
      title: "Usunąć ten trening?",
      description: "Tej operacji nie można cofnąć.",
      confirmLabel: "Usuń",
      destructive: true,
    })
    if (!ok) return
    store.deleteEntry(index)
    toast("Trening usunięty")
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
          {entries.length ? plural(entries.length, ["trening", "treningi", "treningów"]) : "Brak zapisanych treningów"}
      </p>

      {entries.map(({ e, index }) => (
        <Card key={`${e.iso}-${index}`} className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-md text-xs font-bold text-primary-foreground",
                  e.tab === "A" ? "bg-plan-a" : e.tab === "B" ? "bg-plan-b" : "bg-plan-c",
                )}
                aria-label={`Trening ${e.tab}`}
              >
                {e.tab}
              </span>
              {e.date}
            </h3>
            <div className="-mr-2 flex">
              <Button
                variant="ghost"
                size="icon"
                className="size-11 text-muted-foreground"
                aria-label="Edytuj trening"
                onClick={() => setEditing(index)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 text-muted-foreground hover:text-destructive"
                aria-label="Usuń trening"
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {e.exs.map((ex, i) => (
              <div key={i}>
                <div className="text-sm font-medium">{ex.name ? keyLabel(exerciseKey(ex.name, ex.exerciseId), ex.name) : "(bez nazwy)"}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {ex.sets.filter(isFilled).map((s, j) => (
                    <span key={j} className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                      {formatSet(s)}
                    </span>
                  ))}
                </div>
                {ex.note && <p className="mt-1.5 text-xs text-muted-foreground">{ex.note}</p>}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <EditDrawer
        entry={editing === null ? null : store.history[editing]}
        onClose={() => setEditing(null)}
        onSave={(entry) => {
          if (editing === null) return
          store.updateEntry(editing, entry)
          setEditing(null)
          toast.success("Zmiany zapisane")
        }}
      />
    </div>
  )
}
