import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { emptySet } from "@/hooks/use-gym-store"
import { isFilled, type HistoryEntry, type WorkSet } from "@/lib/storage"

interface EditDrawerProps {
  entry: HistoryEntry | null
  onClose: () => void
  onSave: (entry: HistoryEntry) => void
}

export function EditDrawer({ entry, onClose, onSave }: EditDrawerProps) {
  const [draft, setDraft] = useState<HistoryEntry | null>(null)
  // keep the last draft while the drawer animates closed
  useEffect(() => {
    if (entry) setDraft(structuredClone(entry))
  }, [entry])

  const updEx = (ei: number, fn: (ex: HistoryEntry["exs"][number]) => HistoryEntry["exs"][number]) =>
    setDraft((d) => d && { ...d, exs: d.exs.map((x, i) => (i === ei ? fn(x) : x)) })
  const updSet = (ei: number, si: number, patch: Partial<WorkSet>) =>
    updEx(ei, (x) => ({ ...x, sets: x.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) }))

  return (
    <Drawer open={!!entry} onOpenChange={(o) => !o && onClose()} shouldScaleBackground={false} repositionInputs={false}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Edytuj · {draft?.date}</DrawerTitle>
          <DrawerDescription>Zmień nazwy, serie albo notatki.</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-5 overflow-y-auto px-4 pb-2">
          {draft?.exs.map((ex, ei) => (
            <div key={ei} className="space-y-2">
              <Input
                value={ex.name}
                placeholder="Nazwa ćwiczenia"
                aria-label="Nazwa ćwiczenia"
                onChange={(e) => updEx(ei, (x) => ({ ...x, name: e.target.value }))}
                className="h-11 text-base font-medium"
              />
              {ex.sets.map((s, si) => (
                <div key={si} className="grid grid-cols-[1.25rem_1fr_1fr_2.75rem] items-center gap-2">
                  <span className="text-center font-mono text-xs text-muted-foreground">{si + 1}</span>
                  <LabeledNumber label="powt." value={s.reps} inputMode="numeric" onChange={(reps) => updSet(ei, si, { reps })} />
                  <LabeledNumber label="kg" value={s.kg} inputMode="decimal" onChange={(kg) => updSet(ei, si, { kg })} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 text-muted-foreground hover:text-destructive"
                    aria-label={`Usuń serię ${si + 1}`}
                    onClick={() => updEx(ei, (x) => ({ ...x, sets: x.sets.filter((_, j) => j !== si) }))}
                  >
                    <X />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="h-11 w-full border-dashed"
                onClick={() => updEx(ei, (x) => ({ ...x, sets: [...x.sets, emptySet()] }))}
              >
                <Plus /> Dodaj serię
              </Button>
              <Textarea
                value={ex.note}
                rows={2}
                placeholder="Notatki"
                onChange={(e) => updEx(ei, (x) => ({ ...x, note: e.target.value }))}
                className="resize-none text-base"
              />
            </div>
          ))}
        </div>

        <DrawerFooter className="flex-row gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" className="h-12 flex-1" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            className="h-12 flex-1"
            onClick={() =>
              draft && onSave({ ...draft, exs: draft.exs.map((x) => ({ ...x, sets: x.sets.filter(isFilled) })) })
            }
          >
            Zapisz
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function LabeledNumber({
  label,
  value,
  inputMode,
  onChange,
}: {
  label: string
  value: string
  inputMode: "numeric" | "decimal"
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <Input
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder="—"
        aria-label={label}
        onChange={(e) => onChange(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""))}
        className="h-11 pr-12 text-center font-mono text-base tabular"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
