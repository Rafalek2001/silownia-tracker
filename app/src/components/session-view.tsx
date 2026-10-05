import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, ArrowLeftRight, Check, CircleHelp, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DrumPicker, KG_OPTIONS, REPS_OPTIONS } from "@/components/drum-picker"
import { useConfirm } from "@/components/confirm-dialog"
import { mmss, useRestTimer } from "@/components/rest-timer"
import { StretchList } from "@/components/stretch-list"
import type { GymStore } from "@/hooks/use-gym-store"
import { getExercise, restSeconds, techniqueUrl } from "@/lib/exercises"
import { ExercisePicker } from "@/components/exercise-picker"
import { partnerIndex } from "@/lib/plan"
import { lastSession, suggestNext } from "@/lib/stats"
import { formatSet, type Exercise, type Target } from "@/lib/storage"
import { cn } from "@/lib/utils"

// exercises added mid-session from older versions may lack a target
const targetOf = (e: Exercise): Target => e.target ?? { reps: [8, 12], rir: "1–2" }

interface SessionViewProps {
  store: GymStore
  onExit: () => void // back to Today, session stays open
  onFinished: (saved: boolean) => void
}

export function SessionView({ store, onExit, onFinished }: SessionViewProps) {
  const session = store.session!
  const p = session.plan
  const exercises = store.workouts[p]
  const items = exercises.map(targetOf)
  const index = Math.min(session.index, exercises.length)
  const [adding, setAdding] = useState(false)
  const timer = useRestTimer()
  const confirm = useConfirm()

  const go = (i: number) => store.updateSession((s) => ({ ...s, index: Math.max(0, Math.min(exercises.length, i)) }))
  // a pair is one step: jump over the second exercise of a pair
  const stepStart = (i: number) => (items[i - 1]?.pair ? i - 1 : i)
  const nextStep = () => go(items[index]?.pair ? index + 2 : index + 1)
  const prevStep = () => go(stepStart(index - 1))

  const steps = items.filter((_, i) => !items[i - 1]?.pair).length
  const stepNo = items.slice(0, index + 1).filter((_, i) => !items[i - 1]?.pair).length

  const finish = async () => {
    const anyDone = exercises.some((e) => e.sets.some((s) => s.done))
    if (
      !anyDone &&
      !(await confirm({ title: "Zakończyć bez zapisu?", description: "Żadna seria nie jest odhaczona.", confirmLabel: "Zakończ" }))
    )
      return
    timer.stop()
    onFinished(store.finishSession())
  }

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/90 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-lg">
        <Button variant="ghost" size="icon" className="size-11" aria-label="Wróć do ekranu głównego" onClick={onExit}>
          <X />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Trening {p}</div>
          <div className="text-xs text-muted-foreground">
            {index >= exercises.length ? "Rozciąganie" : `Ćwiczenie ${stepNo} z ${steps}`}
            {session.ramp && " · powrót: lżej"}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="size-11" aria-label="Dodaj ćwiczenie do dzisiejszego treningu" onClick={() => setAdding(true)}>
          <Plus />
        </Button>
        {timer.running && (
          <Button
            onClick={timer.stop}
            className={cn("h-10 gap-1 rounded-full px-3 font-mono tabular", timer.left <= 10 && "animate-pulse")}
            aria-label={`Przerwa, zostało ${mmss(timer.left)}. Dotknij, aby zatrzymać`}
          >
            {mmss(timer.left)} <X className="opacity-70" />
          </Button>
        )}
      </header>

      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(Math.min(stepNo, steps) / (steps + 1)) * 100 + (index >= exercises.length ? 100 / (steps + 1) : 0)}%` }}
        />
      </div>

      <main className="flex-1 px-4 pt-4">
        {index >= exercises.length ? (
          <StretchList
            stretches={store.plan[p].stretches}
            done={session.stretches}
            onChange={(stretches) => store.updateSession((s) => ({ ...s, stretches }))}
          />
        ) : (
          <ExerciseStep key={index} store={store} index={index} />
        )}
      </main>

      <ExercisePicker
        open={adding}
        title="Dodaj ćwiczenie"
        description="Tylko do dzisiejszego treningu, zaraz po bieżącym ćwiczeniu. Plan się nie zmienia."
        exclude={exercises.map((e) => e.exerciseId ?? "")}
        onClose={() => setAdding(false)}
        onPick={(id) => store.addSessionExercise(id)}
      />

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-safe backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg gap-2 p-3">
          <Button variant="outline" className="h-12 w-14" aria-label="Poprzednie ćwiczenie" disabled={index === 0} onClick={prevStep}>
            <ArrowLeft />
          </Button>
          {index >= exercises.length ? (
            <Button className="h-12 flex-1 text-base font-semibold" onClick={finish}>
              Zakończ trening
            </Button>
          ) : (
            <Button variant="secondary" className="h-12 flex-1 text-base" onClick={nextStep}>
              {stepNo >= steps ? "Rozciąganie" : "Następne ćwiczenie"} <ArrowRight />
            </Button>
          )}
        </div>
      </nav>
    </div>
  )
}

/** One step: a single exercise, or an antagonist pair done alternately. */
function ExerciseStep({ store, index }: { store: GymStore; index: number }) {
  const session = store.session!
  const p = session.plan
  const items = store.workouts[p].map(targetOf)
  const first = items[index - 1]?.pair ? index - 1 : index
  const partner = partnerIndex(items, first)
  const members = partner === undefined ? [first] : [first, partner]
  const exercises = store.workouts[p]
  const timer = useRestTimer()

  // which exercise of the pair and which set is being edited
  const firstOpen = (ei: number) => {
    const i = exercises[ei]?.sets.findIndex((s) => !s.done) ?? -1
    return i < 0 ? Math.max(0, (exercises[ei]?.sets.length ?? 1) - 1) : i
  }
  const [active, setActive] = useState(() => ({ ex: first, set: firstOpen(first) }))

  const allDone = members.every((ei) => exercises[ei]?.sets.every((s) => s.done))

  const tick = () => {
    const { ex, set } = active
    const wasDone = exercises[ex].sets[set]?.done
    store.updateExercise(p, ex, (e) => ({ ...e, sets: e.sets.map((s, j) => (j === set ? { ...s, done: true } : s)) }))
    if (wasDone) return // correcting an earlier set: no rest, stay put
    const def = getExercise(exercises[ex].exerciseId)
    // after the last set of the step there's nothing to rest for
    const remaining = members.some((ei) => exercises[ei].sets.some((s, j) => !s.done && !(ei === ex && j === set)))
    if (remaining) timer.start(p === "C" ? 60 : restSeconds(def, members.length > 1))
    // carry the values over to the next set of this exercise, then alternate within a pair
    const cur = exercises[ex].sets[set]
    store.updateExercise(p, ex, (e) => ({
      ...e,
      sets: e.sets.map((s, j) => (j > set && !s.done ? { ...s, reps: s.reps || cur.reps, kg: cur.kg } : s)),
    }))
    const other = members.find((ei) => ei !== ex)
    const nextOwn = exercises[ex].sets.findIndex((s, j) => j > set && !s.done)
    const otherOpen = other !== undefined ? exercises[other].sets.findIndex((s) => !s.done) : -1
    if (other !== undefined && otherOpen >= 0 && otherOpen <= set) setActive({ ex: other, set: otherOpen })
    else if (nextOwn >= 0) setActive({ ex, set: nextOwn })
    else if (otherOpen >= 0) setActive({ ex: other!, set: otherOpen })
  }

  return (
    <div className="space-y-4">
      {members.map((ei) => (
        <ExerciseBlock
          key={ei}
          store={store}
          index={ei}
          paired={members.length > 1}
          isActive={active.ex === ei}
          activeSet={active.ex === ei ? active.set : -1}
          onSelect={(set) => setActive({ ex: ei, set })}
        />
      ))}

      <Button
        className="h-14 w-full text-lg font-semibold"
        onClick={tick}
        disabled={allDone && !exercises[active.ex]?.sets[active.set]}
      >
        <Check className="size-5" />
        {exercises[active.ex]?.sets[active.set]?.done ? "Popraw serię" : "Seria zrobiona"}
      </Button>
      {allDone && <p className="text-center text-sm text-muted-foreground">Gotowe — przejdź dalej.</p>}
    </div>
  )
}

function ExerciseBlock({
  store,
  index,
  paired,
  isActive,
  activeSet,
  onSelect,
}: {
  store: GymStore
  index: number
  paired: boolean
  isActive: boolean
  activeSet: number
  onSelect: (set: number) => void
}) {
  const session = store.session!
  const p = session.plan
  const ex = store.workouts[p][index]
  const item = ex ? targetOf(ex) : undefined
  const def = getExercise(ex?.exerciseId)
  const exerciseId = ex?.exerciseId
  const last = useMemo(() => (exerciseId ? lastSession(store.history, exerciseId) : null), [store.history, exerciseId])
  const hint = useMemo(
    () => (!item ? "" : item.deload ? "Lżej o 10% (przegląd)" : suggestNext(def, item, last, session.ramp).reason),
    [def, item, last, session.ramp],
  )
  if (!ex || !item) return null
  const set = ex.sets[activeSet]
  const setVal = (patch: { reps?: string; kg?: string }) =>
    store.updateExercise(p, index, (e) => ({ ...e, sets: e.sets.map((s, j) => (j === activeSet ? { ...s, ...patch } : s)) }))

  return (
    <section
      className={cn("rounded-xl border bg-card p-4 transition-opacity", paired && !isActive && "opacity-60")}
      onClick={() => !isActive && onSelect(ex.sets.findIndex((s) => !s.done) >= 0 ? ex.sets.findIndex((s) => !s.done) : 0)}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {paired && <ArrowLeftRight className="size-3.5 text-muted-foreground" aria-label="Na zmianę" />}
            {item.test && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">TEST</span>}
          </div>
          <h2 className="text-xl font-semibold leading-tight tracking-tight">{ex.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ex.sets.length} × {item.reps[0]}–{item.reps[1]} · RIR {item.rir}
            {hint && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{hint}</span>}
          </p>
        </div>
        {def && (
          <Button asChild variant="ghost" size="icon" className="-mr-2 -mt-1 size-11 shrink-0 text-muted-foreground">
            <a href={techniqueUrl(def)} target="_blank" rel="noreferrer" aria-label={`Technika: ${ex.name}`} onClick={(e) => e.stopPropagation()}>
              <CircleHelp className="size-5" />
            </a>
          </Button>
        )}
      </div>

      {last && (
        <p className="mt-2 text-xs text-muted-foreground">
          Ostatnio {last.date}: <span className="font-mono">{last.sets.map(formatSet).join(" · ")}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {ex.sets.map((s, j) => (
          <button
            key={j}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(j)
            }}
            className={cn(
              "flex h-11 min-w-11 items-center gap-1 rounded-lg border px-2.5 font-mono text-sm tabular transition-colors",
              s.done ? "border-transparent bg-muted text-muted-foreground" : "bg-background",
              j === activeSet && "border-primary ring-1 ring-primary",
            )}
            aria-label={`Seria ${j + 1}${s.done ? ", zrobiona" : ""}`}
          >
            {s.done ? <Check className="size-3.5 text-primary" /> : <span className="text-muted-foreground">{j + 1}</span>}
            {s.done && (
              <span>
                {s.reps || "—"}×{s.kg || "0"}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation()
            store.updateExercise(p, index, (x) => {
              const prev = x.sets[x.sets.length - 1]
              return { ...x, sets: [...x.sets, { reps: prev?.reps ?? "", kg: prev?.kg ?? "", done: false }] }
            })
          }}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed text-muted-foreground"
          aria-label="Dodaj serię"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {isActive && set && (
        <div className="mt-4 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
          <DrumPicker label="Powtórzenia" options={REPS_OPTIONS} value={set.reps} onChange={(reps) => setVal({ reps })} />
          <DrumPicker
            label={def?.added ? "kg dodatkowo" : "kg"}
            options={KG_OPTIONS}
            value={set.kg}
            onChange={(kg) => setVal({ kg })}
          />
        </div>
      )}
    </section>
  )
}
