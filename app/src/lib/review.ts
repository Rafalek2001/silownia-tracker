// Weekly review: looks at the last two weeks of history and proposes small,
// rule-based plan changes the user accepts with one tap. Runs fully offline.

import { getExercise, MUSCLES, resolveExerciseId, type Muscle } from "./exercises"
import type { TrainingPlan } from "./plan"
import { isRampUp, plannedSets, progress } from "./stats"
import { isFilled, ROTATION, todayIso, type HistoryEntry, type Plan } from "./storage"

export type ReviewAction =
  | { type: "deload"; plan: Plan; index: number }
  | { type: "addSet"; plan: Plan; index: number }
  | { type: "removeSet"; plan: Plan; index: number }

export interface ReviewItem {
  key: string
  title: string
  detail: string
  action?: ReviewAction
}

const KEY = "gt5review"
const DAY = 86_400_000
const isoTime = (iso: string) => new Date(`${iso}T12:00:00`).getTime()
// Muscles we actively balance; the rest get indirect work and aren't nudged.
const BALANCED: Muscle[] = ["chest", "lats", "upperBack", "sideDelts", "biceps", "triceps", "quads", "hamstrings", "glutes"]
const MAX_MINUTES = 85

export function lastReview(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function markReviewed(now = new Date()) {
  try {
    localStorage.setItem(KEY, todayIso(now))
  } catch {
    /* ignore */
  }
}

/** Due once a week, and only once there's at least one session to look at. */
export function reviewDue(history: HistoryEntry[], now = new Date()) {
  if (!history.length) return false
  const last = lastReview()
  if (!last) {
    // first review a week after the first session with the new plan
    const firstPlanned = [...history].reverse().find((e) => e.exs.some((x) => x.exerciseId))
    return !!firstPlanned && now.getTime() - isoTime(firstPlanned.iso) >= 7 * DAY
  }
  return now.getTime() - isoTime(last) >= 7 * DAY
}

const minutes = (sets: number) => sets * 2.7 + 8

export function weeklyReview(history: HistoryEntry[], plan: TrainingPlan, now = new Date()): ReviewItem[] {
  const items: ReviewItem[] = []
  const from = now.getTime() - 14 * DAY
  const recent = history.filter((e) => e.tab !== "C" && isoTime(e.iso) > from)
  const ramp = isRampUp(history, now)

  // 1. Consistency — information only, the plan stays the same.
  const lastWeek = history.filter((e) => e.tab !== "C" && isoTime(e.iso) > now.getTime() - 7 * DAY).length
  items.push({
    key: "consistency",
    title: lastWeek >= 2 ? `${lastWeek} treningi w tym tygodniu` : lastWeek === 1 ? "1 trening w tym tygodniu" : "Brak treningów w tym tygodniu",
    detail:
      lastWeek >= 2
        ? "Oba treningi zaliczone — regularność to podstawa."
        : "Plan zostaje bez zmian — liczy się regularność w skali miesięcy, nie jeden tydzień.",
  })

  // How many planned sets were actually done, per plan item.
  const completion = ROTATION.flatMap((p) =>
    plan[p].items.map((it, index) => {
      const sessions = recent.filter((e) => e.tab === p)
      const done = sessions.map((e) => e.exs.find((x) => resolveExerciseId(x.name, x.exerciseId) === it.id)?.sets.filter(isFilled).length ?? 0)
      return { p, index, it, sessions: sessions.length, done: done.reduce((a, b) => a + b, 0), planned: sessions.length * it.sets }
    }),
  )
  const plannedTotal = completion.reduce((a, c) => a + c.planned, 0)
  const doneTotal = completion.reduce((a, c) => a + Math.min(c.done, c.planned), 0)
  const rate = plannedTotal ? doneTotal / plannedTotal : 0

  // 2. Sessions too long: lots of sets skipped → trim the most-skipped exercise by one set.
  if (recent.length >= 2 && rate < 0.75) {
    const worst = completion
      .filter((c) => c.planned && c.it.sets > 2)
      .sort((a, b) => a.done / a.planned - b.done / b.planned)[0]
    if (worst) {
      const name = getExercise(worst.it.id)?.name ?? worst.it.id
      items.push({
        key: `remove-${worst.p}-${worst.index}`,
        title: `Krótszy trening ${worst.p}`,
        detail: `Robisz ok. ${Math.round(rate * 100)}% zaplanowanych serii. Proponuję ${name}: ${worst.it.sets} → ${worst.it.sets - 1} serie, żeby plan był realny.`,
        action: { type: "removeSet", plan: worst.p, index: worst.index },
      })
    }
  }

  // 3. Stalled exercises: no progress (e1RM or reps) over the last 3 sessions → one lighter session.
  if (!ramp) {
    for (const p of ROTATION) {
      plan[p].items.forEach((it, index) => {
        if (it.deload) return
        const pts = progress(history, it.id).slice(-3)
        if (pts.length < 3) return
        const score = (x: (typeof pts)[number]) => x.e1rm ?? x.maxReps ?? 0
        if (score(pts[2]) <= score(pts[0])) {
          const name = getExercise(it.id)?.name ?? it.id
          items.push({
            key: `deload-${p}-${index}`,
            title: `${name}: stoi w miejscu`,
            detail: "Bez postępu od 3 treningów. Następnym razem ok. 10% lżej, potem znów progresja — zwykle to przełamuje zastój.",
            action: { type: "deload", plan: p, index },
          })
        }
      })
    }
  }

  // 4. Everything done and recovered → add one set where weekly volume is lowest.
  if (!ramp && recent.length >= 3 && rate >= 0.9) {
    const weekly = plannedSets(ROTATION.flatMap((p) => plan[p].items))
    const low = BALANCED.filter((m) => weekly[m] < 10).sort((a, b) => weekly[a] - weekly[b])[0]
    if (low) {
      for (const p of ROTATION) {
        const total = plan[p].items.reduce((a, it) => a + it.sets, 0)
        const index = plan[p].items.findIndex((it) => it.sets < 5 && getExercise(it.id)?.primary.includes(low))
        if (index >= 0 && minutes(total + 1) <= MAX_MINUTES) {
          const it = plan[p].items[index]
          items.push({
            key: `add-${p}-${index}`,
            title: `Więcej na: ${MUSCLES[low].toLowerCase()}`,
            detail: `Robisz cały plan, a ${MUSCLES[low].toLowerCase()} dostają ${weekly[low]} serii/tydz. (cel 10–16). ${getExercise(it.id)?.name}: ${it.sets} → ${it.sets + 1} serie.`,
            action: { type: "addSet", plan: p, index },
          })
          break
        }
      }
    }
  }

  return items
}
