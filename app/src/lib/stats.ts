import { getExercise, MUSCLES, normalizeName, resolveExerciseId, type ExerciseDef, type Muscle } from "./exercises"
import type { PlanItem } from "./plan"
import { isFilled, todayIso, type HistoryEntry, type Plan, type WorkSet } from "./storage"

export interface ProgressPoint {
  iso: string
  date: string
  maxKg: number | null
  volume: number | null
  e1rm: number | null
  maxReps: number | null
}

const num = (v: string) => parseFloat(v.replace(",", ".")) || 0
const DAY = 86_400_000
const isoTime = (iso: string) => new Date(`${iso}T12:00:00`).getTime()

/** Stable key for an exercise in history: library id, or the normalized free-text name. */
export function exerciseKey(name: string, id?: string) {
  return resolveExerciseId(name, id) ?? `name:${normalizeName(name)}`
}

export function keyLabel(key: string, fallback: string) {
  return getExercise(key)?.name ?? fallback
}

/**
 * Sets that look like real work: filled, no obvious typos like 32 reps, and no
 * weight far above the rest of the session (e.g. 81 kg among 65–70 kg sets).
 */
function workingSets(sets: WorkSet[]) {
  const ok = sets.filter((s) => isFilled(s) && num(s.reps) <= 30)
  const kgs = ok.filter((s) => s.kg !== "").map((s) => num(s.kg))
  if (kgs.length < 3) return ok
  return ok.filter((s, i, arr) => {
    if (s.kg === "") return true
    const others = arr.filter((o, j) => j !== i && o.kg !== "").map((o) => num(o.kg)).sort((a, b) => a - b)
    const median = others[Math.floor(others.length / 2)]
    return num(s.kg) <= median * 1.2
  })
}

export function lastSession(history: HistoryEntry[], key: string) {
  for (const entry of history) {
    const ex = entry.exs.find((e) => exerciseKey(e.name, e.exerciseId) === key)
    if (ex && ex.sets.some(isFilled)) return { date: entry.date, iso: entry.iso, sets: ex.sets.filter(isFilled) }
  }
  return null
}

/** Typical working weight: most common kg, otherwise the median (shrugs off one-off typos). */
export function workingWeight(sets: WorkSet[]): number | null {
  const kgs = workingSets(sets)
    .filter((s) => s.kg !== "")
    .map((s) => num(s.kg))
  if (!kgs.length) return null
  const counts = new Map<number, number>()
  kgs.forEach((k) => counts.set(k, (counts.get(k) ?? 0) + 1))
  const [top, n] = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]
  if (n > 1) return top
  const sorted = [...kgs].sort((a, b) => a - b)
  const mid = sorted.length / 2
  return sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2
}

const roundTo = (v: number, step: number) => (step > 0 ? Math.round(v / step) * step : v)
const fmt = (v: number) => String(Math.round(v * 100) / 100)

/**
 * Double progression: stay at the weight and add reps until every set hits the
 * top of the range, then add `step` kg and drop back to the bottom.
 * When returning after a break, start ~13% lighter at the bottom of the range.
 */
export function suggestNext(
  def: ExerciseDef | undefined,
  item: Pick<PlanItem, "reps">,
  last: { sets: WorkSet[] } | null,
  ramp: boolean,
): { reps: string; kg: string; reason: string } {
  const [lo, hi] = item.reps
  const step = def?.step || 2.5
  const w = last ? workingWeight(last.sets) : null
  if (!last || w === null) {
    const best = last ? Math.max(0, ...workingSets(last.sets).map((s) => num(s.reps))) : 0
    return best && !ramp
      ? { reps: String(Math.min(hi, Math.max(lo, best + 1))), kg: "", reason: "+1 powt." }
      : { reps: String(lo), kg: "", reason: last ? "" : "Pierwszy raz — dobierz ciężar" }
  }
  if (ramp) {
    return { reps: String(lo), kg: fmt(roundTo(w * 0.87, step)), reason: "Powrót po przerwie: lżej" }
  }
  const atW = workingSets(last.sets).filter((s) => s.kg !== "" && num(s.kg) === w)
  const reps = (atW.length ? atW : workingSets(last.sets)).map((s) => num(s.reps))
  if (reps.length && reps.every((r) => r >= hi)) {
    return { reps: String(lo), kg: fmt(w + step), reason: `+${fmt(step)} kg` }
  }
  const minReps = reps.length ? Math.min(...reps) : lo
  return { reps: String(Math.min(hi, Math.max(lo, minReps + 1))), kg: fmt(w), reason: "+1 powt." }
}

/**
 * Coming back after a break of 4+ weeks (or starting fresh): the first 4
 * sessions (≈ 2 weeks at 2×/week) are lighter, with about 2/3 of the sets.
 */
export function isRampUp(history: HistoryEntry[], now = new Date()) {
  const isos = [...new Set(history.filter((e) => e.tab !== "C").map((e) => e.iso))].sort()
  const times = [...isos.map(isoTime), isoTime(todayIso(now))]
  let since = 0
  for (let i = times.length - 1; i > 0; i--) {
    if (times[i] - times[i - 1] > 28 * DAY) break
    since++
  }
  // `since` = sessions done since the last long gap
  return isos.length === 0 || since < 4
}

export const rampSets = (sets: number) => Math.max(1, Math.round((sets * 2) / 3))

/** A and B alternate; C (occasional calisthenics) is skipped. */
export function nextPlan(history: HistoryEntry[]): Plan {
  return history.find((e) => e.tab !== "C")?.tab === "A" ? "B" : "A"
}

export type MuscleSets = Record<Muscle, number>

export const emptyMuscleSets = () =>
  Object.fromEntries(Object.keys(MUSCLES).map((m) => [m, 0])) as MuscleSets

/** Fractional sets per muscle: 1 per set for primary muscles, 0.5 for secondary. */
export function addSets(acc: MuscleSets, def: ExerciseDef | undefined, sets: number) {
  if (!def) return acc
  def.primary.forEach((m) => (acc[m] += sets))
  def.secondary?.forEach((m) => (acc[m] += sets / 2))
  return acc
}

export function plannedSets(items: { id: string; sets: number }[]) {
  return items.reduce((acc, it) => addSets(acc, getExercise(it.id), it.sets), emptyMuscleSets())
}

/** Sets actually done in the last 7 days, per muscle. */
export function weekSets(history: HistoryEntry[], now = new Date()) {
  const from = now.getTime() - 7 * DAY
  return history
    .filter((e) => isoTime(e.iso) > from)
    .flatMap((e) => e.exs)
    .reduce(
      (acc, ex) => addSets(acc, getExercise(resolveExerciseId(ex.name, ex.exerciseId)), workingSets(ex.sets).length),
      emptyMuscleSets(),
    )
}

/** How many sessions the current test exercise has been done since it was put in. */
export function testSessions(history: HistoryEntry[], id: string, fromIso?: string) {
  return history.filter((e) => (!fromIso || e.iso >= fromIso) && e.exs.some((x) => exerciseKey(x.name, x.exerciseId) === id))
    .length
}

/** Exercises with history, newest first: key + display label. */
export function exerciseOptions(history: HistoryEntry[]) {
  const seen = new Map<string, string>()
  for (const e of history)
    for (const x of e.exs) {
      if (!x.name.trim() || !x.sets.some(isFilled)) continue
      const key = exerciseKey(x.name, x.exerciseId)
      if (!seen.has(key)) seen.set(key, keyLabel(key, x.name.replace(/\s*\(.*?\)\s*/g, " ").trim()))
    }
  return [...seen].map(([key, label]) => ({ key, label }))
}

export function progress(history: HistoryEntry[], key: string): ProgressPoint[] {
  return [...history]
    .sort((a, b) => a.iso.localeCompare(b.iso))
    .flatMap((entry) => {
      const ex = entry.exs.find((e) => exerciseKey(e.name, e.exerciseId) === key)
      const sets = workingSets(ex?.sets ?? [])
      if (!sets.length) return []
      const withKg = sets.filter((s) => s.kg !== "")
      const withReps = sets.filter((s) => s.reps !== "")
      const both = sets.filter((s) => s.reps !== "" && s.kg !== "")
      return [
        {
          iso: entry.iso,
          date: entry.date,
          maxKg: withKg.length ? Math.max(...withKg.map((s) => num(s.kg))) : null,
          volume: both.length ? Math.round(both.reduce((a, s) => a + num(s.kg) * num(s.reps), 0)) : null,
          // Epley: kg × (1 + reps / 30)
          e1rm: both.length
            ? Math.round(Math.max(...both.map((s) => num(s.kg) * (1 + num(s.reps) / 30))) * 10) / 10
            : null,
          maxReps: withReps.length ? Math.max(...withReps.map((s) => num(s.reps))) : null,
        },
      ]
    })
}
