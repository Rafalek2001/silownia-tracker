import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import {
  EXERCISES,
  loadCustomExercises,
  MUSCLES,
  normalizeName,
  saveCustomExercise,
  type ExerciseDef,
  type Muscle,
} from "@/lib/exercises"
import { cn } from "@/lib/utils"

interface ExercisePickerProps {
  open: boolean
  title: string
  description?: string
  exclude: string[] // ids already in the plan day
  onClose: () => void
  onPick: (id: string) => void
}

const describe = (e: ExerciseDef) => [...e.primary, ...(e.secondary ?? [])].map((m) => MUSCLES[m]).join(", ")

export function ExercisePicker({ open, title, description, exclude, onClose, onPick }: ExercisePickerProps) {
  const [q, setQ] = useState("")
  const [custom, setCustom] = useState<{ name: string; muscles: Muscle[] } | null>(null)
  const [muscle, setMuscle] = useState<Muscle | null>(null)
  const all = [...EXERCISES, ...loadCustomExercises()].filter((e) => !exclude.includes(e.id))
  const nq = normalizeName(q)
  const list = all
    .filter((e) => !nq || normalizeName(e.name).includes(nq) || e.en.includes(q.toLowerCase()))
    .filter((e) => !muscle || e.primary.includes(muscle))

  const close = () => {
    setQ("")
    setCustom(null)
    setMuscle(null)
    onClose()
  }

  const saveCustom = () => {
    if (!custom?.name.trim() || !custom.muscles.length) return
    const id = `custom-${normalizeName(custom.name).replace(/[^a-z0-9]+/g, "-")}`
    saveCustomExercise({ id, name: custom.name.trim(), en: custom.name.trim(), primary: custom.muscles, compound: false, step: 2.5 })
    onPick(id)
    close()
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && close()} shouldScaleBackground={false} repositionInputs={false}>
      <DrawerContent className="max-h-[88dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>

        {custom ? (
          <div className="space-y-4 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Input
              autoFocus
              value={custom.name}
              placeholder="Nazwa ćwiczenia"
              onChange={(e) => setCustom({ ...custom, name: e.target.value })}
              className="h-11 text-base"
            />
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Które mięśnie głównie pracują?</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(MUSCLES) as Muscle[]).map((m) => {
                  const on = custom.muscles.includes(m)
                  return (
                    <button
                      key={m}
                      onClick={() =>
                        setCustom({ ...custom, muscles: on ? custom.muscles.filter((x) => x !== m) : [...custom.muscles, m] })
                      }
                      className={cn(
                        "h-10 rounded-full border px-3 text-sm",
                        on ? "border-primary bg-primary text-primary-foreground" : "bg-card",
                      )}
                    >
                      {MUSCLES[m]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-12 flex-1" onClick={() => setCustom(null)}>
                Wróć
              </Button>
              <Button className="h-12 flex-1" disabled={!custom.name.trim() || !custom.muscles.length} onClick={saveCustom}>
                Dodaj
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative shrink-0 px-4 pb-2">
              <Search className="pointer-events-none absolute left-7 top-3 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj" className="h-11 pl-9 text-base" />
            </div>
            <div className="flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {([null, ...Object.keys(MUSCLES)] as (Muscle | null)[]).map((m) => (
                <button
                  key={m ?? "all"}
                  onClick={() => setMuscle(m)}
                  className={cn(
                    "h-9 shrink-0 rounded-full border px-3 text-sm",
                    muscle === m ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                  )}
                >
                  {m ? MUSCLES[m] : "Wszystkie"}
                </button>
              ))}
            </div>
            <ul className="overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {list.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => {
                      onPick(e.id)
                      close()
                    }}
                    className="flex min-h-14 w-full flex-col justify-center rounded-lg px-3 py-2 text-left hover:bg-accent"
                  >
                    <span className="text-sm font-medium">{e.name}</span>
                    <span className="text-xs text-muted-foreground">{describe(e)}</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setCustom({ name: q, muscles: muscle ? [muscle] : [] })}
                  className="flex min-h-14 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-primary hover:bg-accent"
                >
                  <Plus className="size-4" /> Własne ćwiczenie{q && `: „${q}”`}
                </button>
              </li>
            </ul>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

