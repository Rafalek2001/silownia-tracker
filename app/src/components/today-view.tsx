import { useState } from "react"
import { ArrowLeftRight, ChevronRight, Play, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useConfirm } from "@/components/confirm-dialog"
import { ExercisePicker } from "@/components/exercise-picker"
import { MuscleMap } from "@/components/muscle-map"
import { PlanItemDrawer } from "@/components/plan-item-drawer"
import { ReviewCard } from "@/components/review-card"
import type { GymStore } from "@/hooks/use-gym-store"
import { getExercise } from "@/lib/exercises"
import { isRampUp, nextPlan, plannedSets, rampSets, testSessions, weekSets } from "@/lib/stats"
import { PLANS, plural, type Plan } from "@/lib/storage"
import { cn } from "@/lib/utils"

const TEST_SESSIONS = 3
const TITLES: Record<Plan, string> = {
  A: "Przysiad + poziomo",
  B: "Zawias biodrowy + pionowo",
  C: "Kalistenika · ok. 30 min",
}

export function TodayView({ store, onOpenSession }: { store: GymStore; onOpenSession: () => void }) {
  const confirm = useConfirm()
  const suggested = nextPlan(store.history)
  const [picked, setPicked] = useState<Plan | null>(null)
  const p = store.session?.plan ?? picked ?? suggested
  const [mode, setMode] = useState<"today" | "week">("today")
  const [swap, setSwap] = useState<number | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const day = store.plan[p]
  const ramp = store.session?.ramp ?? (p !== "C" && isRampUp(store.history))
  const minutes = (sets: number) => Math.round(p === "C" ? sets * 1.5 : sets * 2.7 + 8)
  const items = day.items.map((it) => ({ ...it, sets: ramp ? rampSets(it.sets) : it.sets }))
  const totalSets = items.reduce((a, it) => a + it.sets, 0)
  const doneSets = store.session ? store.workouts[p].reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0) : 0
  const testIdx = day.items.findIndex((it) => it.test)
  const test = day.items[testIdx]
  const testDone = test ? testSessions(store.history, test.id, test.testFrom) : 0

  return (
    <div className="space-y-4">
      {!store.session && (
        <div role="tablist" aria-label="Plan" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {PLANS.map((x) => (
            <button
              key={x}
              role="tab"
              aria-selected={p === x}
              onClick={() => setPicked(x)}
              className={cn(
                "flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors",
                p === x ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {x === "C" ? "C · extra" : `Trening ${x}`}
              {x === suggested && <span className="size-1.5 rounded-full bg-primary" aria-label="następny w kolejce" />}
            </button>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">
          {store.session ? `Trening ${p} w toku` : TITLES[p]}
        </h2>
        <p className="text-sm text-muted-foreground">
          {store.session
            ? `${doneSets} z ${store.workouts[p].reduce((a, e) => a + e.sets.length, 0)} serii zrobione`
            : `${plural(items.length, ["ćwiczenie", "ćwiczenia", "ćwiczeń"])} · ${totalSets} serii · ok. ${minutes(totalSets)} min`}
        </p>
        {p === "C" && !store.session && (
          <p className="mt-2 text-sm text-muted-foreground">
            Dodatkowy trening z masą ciała, kiedy masz ochotę albo nie dasz rady na siłownię. Nie zmienia kolejności A/B. Potrzebny drążek i poręcze lub ławka.
          </p>
        )}
        {ramp && (
          <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">
            Powrót po przerwie: przez pierwsze 4 treningi mniej serii i ok. 13% lżej. Kończ serie z 3–4 powtórzeniami w zapasie.
          </p>
        )}
      </div>

      <ReviewCard store={store} />

      {test && testDone >= TEST_SESSIONS && !store.session && (
        <Card className="space-y-3 p-4">
          <p className="text-sm">
            <span className="font-semibold">{getExercise(test.id)?.name}</span> testujesz od {plural(testDone, ["treningu", "treningów", "treningów"])}. Zostawić je czy spróbować czegoś nowego?
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="h-11 flex-1" onClick={() => store.keepTest(p, testIdx)}>
              Zostaw
            </Button>
            <Button className="h-11 flex-1" onClick={() => setSwap(testIdx)}>
              Wymień
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">Mięśnie</span>
          <div className="flex rounded-lg bg-muted p-0.5 text-xs">
            {(["today", "week"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn("h-10 rounded-md px-3", mode === m ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}
              >
                {m === "today" ? "Ten trening" : "Ostatnie 7 dni"}
              </button>
            ))}
          </div>
        </div>
        {mode === "today" ? (
          <MuscleMap sets={plannedSets(items)} thresholds={[3, 6]} legend={["1–2 serie", "3–5", "6+"]} />
        ) : (
          <MuscleMap sets={weekSets(store.history)} thresholds={[10, 16]} legend={["<10 serii", "10–15", "16+"]} />
        )}
      </Card>

      <ol className="divide-y rounded-xl border bg-card">
        {items.map((it, i) => {
          const def = getExercise(it.id)
          return (
            <li key={`${it.id}-${i}`}>
              <button
                onClick={() => !store.session && setEditing(i)}
                disabled={!!store.session}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left"
              >
                <span className="w-5 font-mono text-xs text-muted-foreground">
                  {day.items[i - 1]?.pair ? <ArrowLeftRight className="size-3.5" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {def?.name ?? it.id}
                    {it.test && <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-primary">TEST</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {it.sets} × {it.reps[0]}–{it.reps[1]}
                    {it.pair && " · na zmianę z następnym"}
                    {it.deload && " · lżej o 10%"}
                  </span>
                </span>
                {!store.session && <ChevronRight className="size-4 text-muted-foreground/60" />}
              </button>
            </li>
          )
        })}
        {!store.session && (
          <li>
            <button onClick={() => setAdding(true)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm font-medium text-primary">
              <Plus className="size-4" /> Dodaj ćwiczenie do planu {p}
            </button>
          </li>
        )}
        <li className="px-4 py-3 text-xs text-muted-foreground">
          + rozciąganie: {day.stretches.length} pozycji, ok. {Math.round((day.stretches.length * 2 * 45) / 60)} min
        </li>
      </ol>

      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 space-y-2">
        <Button
          className="h-14 w-full text-lg font-semibold shadow-lg"
          onClick={() => {
            if (!store.session) store.startSession(p)
            onOpenSession()
          }}
        >
          <Play className="size-5" /> {store.session ? "Wróć do treningu" : `Start: trening ${p}`}
        </Button>
        {store.session && (
          <Button
            variant="ghost"
            className="h-11 w-full text-muted-foreground"
            onClick={async () => {
              if (await confirm({ title: "Przerwać trening?", description: "Odhaczone serie nie zostaną zapisane.", confirmLabel: "Przerwij", destructive: true }))
                store.cancelSession()
            }}
          >
            Przerwij bez zapisu
          </Button>
        )}
      </div>

      <PlanItemDrawer
        store={store}
        plan={p}
        index={editing}
        onClose={() => setEditing(null)}
        onSwap={(i) => {
          setEditing(null)
          setSwap(i)
        }}
      />

      <ExercisePicker
        open={adding}
        title={`Dodaj do planu ${p}`}
        description="Trafi na koniec treningu: 3 serie, zakres powtórzeń dobrany do typu ćwiczenia."
        exclude={day.items.map((it) => it.id)}
        onClose={() => setAdding(false)}
        onPick={(id) => store.addPlanItem(p, id)}
      />

      <ExercisePicker
        open={swap !== null}
        title={swap !== null && day.items[swap]?.test ? "Nowe ćwiczenie testowe" : "Wymień ćwiczenie"}
        description={swap !== null ? `Zamiast: ${getExercise(day.items[swap]?.id)?.name ?? ""}. Serie i powtórzenia zostają.` : undefined}
        exclude={day.items.map((it) => it.id)}
        onClose={() => setSwap(null)}
        onPick={(id) => swap !== null && store.replacePlanItem(p, swap, id)}
      />
    </div>
  )
}
