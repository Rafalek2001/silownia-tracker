import { getExercise } from "./exercises"
import type { Plan } from "./storage"

export interface PlanItem {
  id: string // exercise id
  sets: number
  reps: [number, number]
  rir: string // target reps in reserve, e.g. "1–2"
  pair?: boolean // alternate with the next item (antagonist pair)
  test?: boolean // the rotating "try something new" slot
  testFrom?: string // yyyy-mm-dd the current test exercise was put in
  deload?: boolean // weekly review: next session ~10% lighter, then cleared
}

export interface Stretch {
  name: string
  seconds: number
  rounds: number
}

export interface DayPlan {
  items: PlanItem[]
  stretches: Stretch[]
}

export type TrainingPlan = Record<Plan, DayPlan>

const S = (name: string): Stretch => ({ name, seconds: 40, rounds: 2 })

// Evidence-based 2×/week full body, built around the exercises from the user's
// history (see the plan doc): A = squat + horizontal push/pull, B = hinge + vertical.
export const DEFAULT_PLAN: TrainingPlan = {
  A: {
    items: [
      { id: "squat", sets: 4, reps: [6, 10], rir: "1–2" },
      { id: "bench-press", sets: 4, reps: [6, 10], rir: "1–2", pair: true },
      { id: "db-row", sets: 4, reps: [8, 12], rir: "1–2" },
      { id: "seated-leg-curl", sets: 3, reps: [10, 15], rir: "0–1" },
      { id: "lateral-raise", sets: 3, reps: [12, 20], rir: "0–1" },
      { id: "seated-db-curl", sets: 3, reps: [10, 15], rir: "0–1", pair: true },
      { id: "triceps-pushdown", sets: 3, reps: [10, 15], rir: "0–1" },
      { id: "cable-fly", sets: 3, reps: [12, 15], rir: "0–1", test: true },
    ],
    stretches: [
      S("Wykrok klęczny — zginacze bioder"),
      S("Czworogłowe — pięta do pośladka"),
      S("Dwugłowe uda — skłon na prostej nodze"),
      S("Klatka — ramię na framudze"),
      S("Najszerszy — zwis lub skłon przy ławce"),
    ],
  },
  B: {
    items: [
      { id: "rdl", sets: 3, reps: [6, 10], rir: "1–2" },
      { id: "ohp", sets: 3, reps: [6, 10], rir: "1–2", pair: true },
      { id: "pull-up", sets: 4, reps: [6, 10], rir: "1–2" },
      { id: "leg-press", sets: 3, reps: [10, 15], rir: "1–2" },
      { id: "dips", sets: 3, reps: [8, 12], rir: "1–2", pair: true },
      { id: "seated-cable-row", sets: 3, reps: [10, 15], rir: "1–2" },
      { id: "cable-lateral-raise", sets: 3, reps: [12, 20], rir: "0–1" },
      { id: "overhead-triceps-extension", sets: 2, reps: [10, 15], rir: "0–1", pair: true },
      { id: "incline-db-curl", sets: 2, reps: [10, 15], rir: "0–1" },
      { id: "standing-calf-raise", sets: 3, reps: [10, 15], rir: "0–1", test: true },
    ],
    stretches: [
      S("Dwugłowe uda — skłon w przód"),
      S("Pośladek — noga na kolanie (figure-4)"),
      S("Łydki — przy ścianie"),
      S("Klatka i przód barku — ręce splecione za plecami"),
      S("Triceps — ręka za głową"),
    ],
  },
  // Occasional ~30 min bodyweight full body (pull-up bar + bars/bench). Pairs keep it short.
  C: {
    items: [
      { id: "chin-up", sets: 3, reps: [5, 12], rir: "1–2", pair: true },
      { id: "push-up", sets: 3, reps: [8, 25], rir: "1–2" },
      { id: "bw-split-squat", sets: 3, reps: [10, 20], rir: "1–2", pair: true },
      { id: "pike-push-up", sets: 3, reps: [6, 15], rir: "1–2" },
      { id: "inverted-row", sets: 2, reps: [8, 20], rir: "0–1", pair: true },
      { id: "dips", sets: 2, reps: [6, 15], rir: "0–1" },
      { id: "single-leg-hip-thrust", sets: 2, reps: [10, 20], rir: "0–1", pair: true },
      { id: "hanging-leg-raise", sets: 2, reps: [8, 15], rir: "0–1" },
    ],
    stretches: [
      S("Klatka i przód barku — przy framudze"),
      S("Zginacze bioder — wykrok klęczny"),
      S("Dwugłowe uda — skłon w przód"),
    ],
  },
}

const KEY = "gt5plan"

export function loadPlan(): TrainingPlan {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null")
    if (p?.A?.items && p?.B?.items) return { ...DEFAULT_PLAN, ...p } // plans saved before C existed get the default C
  } catch {
    /* fall through */
  }
  return DEFAULT_PLAN
}

export function savePlan(p: TrainingPlan) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

/** Index of the item this one is paired with, if any. */
export function partnerIndex(items: { pair?: boolean }[], i: number) {
  if (items[i]?.pair) return i + 1
  if (items[i - 1]?.pair) return i - 1
  return undefined
}

/** Sensible defaults for an exercise added by hand: heavier range for compounds. */
export function newPlanItem(id: string): PlanItem {
  return getExercise(id)?.compound
    ? { id, sets: 3, reps: [6, 10], rir: "1–2" }
    : { id, sets: 3, reps: [10, 15], rir: "0–1" }
}
