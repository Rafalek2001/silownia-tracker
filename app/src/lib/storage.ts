// Same localStorage keys and shapes as the original single-file app, so
// existing data on the phone keeps working: gt5 = current workouts, gt5h = history.

export type Plan = "A" | "B" | "C"
export const PLANS: Plan[] = ["A", "B", "C"]
/** A and B alternate; C is an occasional extra that doesn't move the rotation. */
export const ROTATION: Plan[] = ["A", "B"]

export interface WorkSet {
  reps: string
  kg: string
  done?: boolean // ticked off during a session
}

export interface Exercise {
  name: string
  sets: WorkSet[]
  note: string
  open?: boolean
  exerciseId?: string // library id (new entries); old entries are resolved by name
  target?: Target // session only: what the plan asks for
}

export interface Target {
  reps: [number, number]
  rir: string
  pair?: boolean
  test?: boolean
  deload?: boolean
}

export type Workouts = Record<Plan, Exercise[]>

export interface HistoryEntry {
  tab: Plan
  date: string // display date, e.g. "05 paź 2026"
  iso: string // yyyy-mm-dd
  exs: Omit<Exercise, "open">[]
}

const HISTORY_LIMIT = 120

function read<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) || "null")
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked — nothing sensible to do */
  }
}

export function loadWorkouts(): Workouts {
  const d = read<Workouts>("gt5") ?? read<Workouts>("gt4") ?? read<Workouts>("gt3")
  return { A: d?.A ?? [], B: d?.B ?? [], C: d?.C ?? [] }
}

export function saveWorkouts(w: Workouts) {
  write("gt5", w)
}

export function loadHistory(): HistoryEntry[] {
  const h = read<HistoryEntry[]>("gt5h")
  if (h?.length) return h
  const old = read<HistoryEntry[]>("gt4h") ?? read<HistoryEntry[]>("gt3h") ?? []
  if (old.length) write("gt5h", old)
  return old
}

export function saveHistory(h: HistoryEntry[]) {
  write("gt5h", h.slice(0, HISTORY_LIMIT))
}

export const isFilled = (s: WorkSet) => s.reps !== "" || s.kg !== ""

/** Local calendar date as yyyy-mm-dd (toISOString would use UTC and flip near midnight). */
export function todayIso(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function displayDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/** Polish plural: plural(5, ["ćwiczenie", "ćwiczenia", "ćwiczeń"]) → "5 ćwiczeń" */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  if (n === 1) return `1 ${one}`
  const last = n % 10
  const lastTwo = n % 100
  return `${n} ${last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many}`
}

export const exerciseCount = (n: number) => plural(n, ["ćwiczenie", "ćwiczenia", "ćwiczeń"])

export function formatSet(s: WorkSet) {
  return `${s.reps !== "" ? s.reps : "—"} × ${s.kg !== "" ? `${s.kg} kg` : "—"}`
}

/** The workout in progress: which plan, where the user is, and stretch progress. */
export interface Session {
  plan: Plan
  startedAt: number
  index: number // current exercise; === exercises.length means the stretching step
  ramp: boolean // returning after a break → fewer sets, lighter
  stretches: number[] // rounds done per stretch
}

export function loadSession(): Session | null {
  return read<Session>("gt5s")
}

export function saveSession(s: Session | null) {
  if (s) write("gt5s", s)
  else
    try {
      localStorage.removeItem("gt5s")
    } catch {
      /* ignore */
    }
}

export function exportData(workouts: Workouts, history: HistoryEntry[]) {
  const data = { workouts, history, exportedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `gymtracker-${todayIso()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
