import { useCallback, useEffect, useState } from "react"
import { getExercise } from "@/lib/exercises"
import { DEFAULT_PLAN, loadPlan, newPlanItem, partnerIndex, savePlan, type PlanItem, type TrainingPlan } from "@/lib/plan"
import { markReviewed, type ReviewAction } from "@/lib/review"
import { isRampUp, lastSession, rampSets, suggestNext } from "@/lib/stats"
import {
  displayDate,
  isFilled,
  loadHistory,
  loadSession,
  loadWorkouts,
  saveHistory,
  saveSession,
  saveWorkouts,
  todayIso,
  type Exercise,
  type HistoryEntry,
  type Plan,
  type Session,
  type Workouts,
} from "@/lib/storage"

export const emptySet = () => ({ reps: "", kg: "" })

/** Session exercise from a plan item, pre-filled with the suggested progression. */
function buildExercise(it: PlanItem, history: HistoryEntry[], ramp: boolean): Exercise {
  const def = getExercise(it.id)
  const s = suggestNext(def, it, lastSession(history, it.id), ramp)
  if (it.deload && s.kg) s.kg = String(Math.max(0, Math.round((Number(s.kg) * 0.9) / (def?.step || 2.5)) * (def?.step || 2.5)))
  const n = ramp ? rampSets(it.sets) : it.sets
  return {
    name: def?.name ?? it.id,
    exerciseId: it.id,
    note: "",
    target: { reps: it.reps, rir: it.rir, pair: it.pair, test: it.test, deload: it.deload },
    sets: Array.from({ length: n }, () => ({ reps: s.reps, kg: s.kg, done: false })),
  }
}

export function useGymStore() {
  const [workouts, setWorkouts] = useState<Workouts>(loadWorkouts)
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const [plan, setPlan] = useState<TrainingPlan>(loadPlan)
  const [session, setSession] = useState<Session | null>(loadSession)

  useEffect(() => {
    saveWorkouts(workouts)
  }, [workouts])
  useEffect(() => {
    saveHistory(history)
  }, [history])
  useEffect(() => {
    savePlan(plan)
  }, [plan])
  useEffect(() => {
    saveSession(session)
  }, [session])

  const updateExercise = useCallback(
    (p: Plan, i: number, fn: (ex: Exercise) => Exercise) =>
      setWorkouts((w) => ({ ...w, [p]: w[p].map((ex, j) => (j === i ? fn(ex) : ex)) })),
    [],
  )

  /** Builds today's workout from the plan, pre-filled with the suggested progression. */
  const startSession = useCallback(
    (p: Plan) => {
      if (session?.plan === p) return
      const ramp = p !== "C" && isRampUp(history)
      const exercises = plan[p].items.map((it) => buildExercise(it, history, ramp))
      setWorkouts((w) => ({ ...w, [p]: exercises }))
      setSession({ plan: p, startedAt: Date.now(), index: 0, ramp, stretches: plan[p].stretches.map(() => 0) })
    },
    [history, plan, session],
  )

  /** Adds an exercise to today's workout only, right after the current step. */
  const addSessionExercise = useCallback(
    (id: string) => {
      if (!session) return
      const p = session.plan
      const list = workouts[p]
      const end = list[session.index]?.target?.pair ? session.index + 2 : session.index + 1
      const at = Math.min(list.length, end)
      const ex = buildExercise(newPlanItem(id), history, false)
      setWorkouts((w) => ({ ...w, [p]: [...w[p].slice(0, at), ex, ...w[p].slice(at)] }))
      setSession((s) => s && { ...s, index: at })
    },
    [session, workouts, history],
  )

  const updateSession = useCallback((fn: (s: Session) => Session) => setSession((s) => s && fn(s)), [])

  /** Saves ticked sets to history and ends the session. Returns false if nothing was done. */
  const finishSession = useCallback(() => {
    if (!session) return false
    const iso = todayIso()
    const exs = workouts[session.plan]
      .map((e) => ({
        name: e.name,
        exerciseId: e.exerciseId,
        note: e.note.trim(),
        sets: e.sets.filter((s) => s.done && isFilled(s)).map(({ reps, kg }) => ({ reps, kg })),
      }))
      .filter((e) => e.sets.length)
    if (exs.length) {
      setHistory((h) => [{ tab: session.plan, date: displayDate(iso), iso, exs }, ...h])
      // a deload is a one-off: clear it once that exercise has been done
      const doneIds = new Set(exs.map((e) => e.exerciseId))
      setPlan((pl) => ({
        ...pl,
        [session.plan]: {
          ...pl[session.plan],
          items: pl[session.plan].items.map((it) => (it.deload && doneIds.has(it.id) ? { ...it, deload: false } : it)),
        },
      }))
    }
    setWorkouts((w) => ({ ...w, [session.plan]: [] }))
    setSession(null)
    return exs.length > 0
  }, [session, workouts])

  const cancelSession = useCallback(() => {
    if (!session) return
    setWorkouts((w) => ({ ...w, [session.plan]: [] }))
    setSession(null)
  }, [session])

  /** Swaps the exercise in a plan slot (used for the test slot and plan edits). */
  const replacePlanItem = useCallback((p: Plan, index: number, id: string) => {
    setPlan((pl) => ({
      ...pl,
      [p]: {
        ...pl[p],
        items: pl[p].items.map((it, i) => (i === index ? { ...it, id, testFrom: it.test ? todayIso() : undefined } : it)),
      },
    }))
  }, [])

  const addPlanItem = useCallback((p: Plan, id: string) => {
    setPlan((pl) => ({ ...pl, [p]: { ...pl[p], items: [...pl[p].items, newPlanItem(id)] } }))
  }, [])

  const removePlanItem = useCallback((p: Plan, index: number) => {
    setPlan((pl) => {
      const items = pl[p].items.map((it) => ({ ...it }))
      const partner = partnerIndex(items, index)
      if (partner !== undefined) items[Math.min(index, partner)].pair = false // the pair is broken up
      return { ...pl, [p]: { ...pl[p], items: items.filter((_, i) => i !== index) } }
    })
  }, [])

  const setPlanSets = useCallback((p: Plan, index: number, sets: number) => {
    setPlan((pl) => ({
      ...pl,
      [p]: { ...pl[p], items: pl[p].items.map((it, i) => (i === index ? { ...it, sets: Math.max(1, Math.min(8, sets)) } : it)) },
    }))
  }, [])

  /** "Keep it for longer": restarts the test slot's 3-session counter. */
  const keepTest = useCallback((p: Plan, index: number) => {
    setPlan((pl) => ({
      ...pl,
      [p]: { ...pl[p], items: pl[p].items.map((it, i) => (i === index ? { ...it, testFrom: todayIso() } : it)) },
    }))
  }, [])

  const resetPlan = useCallback(() => setPlan(DEFAULT_PLAN), [])

  /** Applies accepted weekly-review suggestions and marks the review done. */
  const applyReview = useCallback((actions: ReviewAction[]) => {
    setPlan((pl) => {
      const next = structuredClone(pl)
      for (const a of actions) {
        const it = next[a.plan].items[a.index]
        if (!it) continue
        if (a.type === "deload") it.deload = true
        if (a.type === "addSet") it.sets = Math.min(6, it.sets + 1)
        if (a.type === "removeSet") it.sets = Math.max(1, it.sets - 1)
      }
      return next
    })
    markReviewed()
  }, [])

  const updateEntry = useCallback(
    (index: number, entry: HistoryEntry) => setHistory((h) => h.map((e, i) => (i === index ? entry : e))),
    [],
  )
  const deleteEntry = useCallback((index: number) => setHistory((h) => h.filter((_, i) => i !== index)), [])

  /** Replaces history with a GymTracker export (JSON from „Eksportuj”). */
  const importHistory = useCallback((entries: HistoryEntry[]) => {
    setHistory([...entries].sort((a, b) => b.iso.localeCompare(a.iso)))
  }, [])

  return {
    workouts,
    history,
    plan,
    session,
    updateExercise,
    startSession,
    updateSession,
    finishSession,
    cancelSession,
    replacePlanItem,
    addPlanItem,
    removePlanItem,
    setPlanSets,
    addSessionExercise,
    keepTest,
    resetPlan,
    applyReview,
    updateEntry,
    deleteEntry,
    importHistory,
  }
}

export type GymStore = ReturnType<typeof useGymStore>
