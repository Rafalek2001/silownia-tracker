import { getExercise, restSeconds } from "./exercises"
import type { Plan } from "./storage"

// Rest time per exercise. Starts from a sensible default and remembers the
// user's ±15 s adjustments, so the next rest for that exercise starts there.

const KEY = "gt5rest"
export const MIN_REST = 15
export const MAX_REST = 600

function load(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}")
  } catch {
    return {}
  }
}

export function restFor(id: string | undefined, plan: Plan) {
  const saved = id ? load()[id] : undefined
  if (saved) return saved
  return plan === "C" ? 60 : restSeconds(getExercise(id), false)
}

export function saveRest(id: string, seconds: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...load(), [id]: clampRest(seconds) }))
  } catch {
    /* ignore */
  }
}

export const clampRest = (s: number) => Math.max(MIN_REST, Math.min(MAX_REST, Math.round(s / 15) * 15))
