// Exercise library: muscles worked (for the muscle map and weekly volume),
// rest/progression defaults, technique video, and aliases that map free-text
// names from the old app's history onto library ids.

export type Muscle =
  | "chest"
  | "frontDelts"
  | "sideDelts"
  | "rearDelts"
  | "lats"
  | "upperBack"
  | "biceps"
  | "triceps"
  | "abs"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"

export const MUSCLES: Record<Muscle, string> = {
  chest: "Klatka",
  frontDelts: "Barki przód",
  sideDelts: "Barki bok",
  rearDelts: "Barki tył",
  lats: "Najszersze",
  upperBack: "Górne plecy",
  biceps: "Biceps",
  triceps: "Triceps",
  abs: "Brzuch",
  quads: "Czworogłowe",
  hamstrings: "Dwugłowe uda",
  glutes: "Pośladki",
  calves: "Łydki",
}

export interface ExerciseDef {
  id: string
  name: string
  en: string // English name, used for the technique search fallback
  primary: Muscle[] // counts as 1 set
  secondary?: Muscle[] // counts as 0.5 set (fractional method, Pelland 2024)
  compound: boolean // compound → longer rest
  step: number // kg added when the top of the rep range is reached
  added?: boolean // bodyweight exercise; kg = load added to bodyweight
  video?: { url: string; title: string; author: string } // technique video, checked via YouTube oEmbed
  aliases?: string[]
}

export const EXERCISES: ExerciseDef[] = [
  // — Core plan —
  { id: "squat", name: "Przysiad", en: "barbell squat", video: { url: "https://www.youtube.com/watch?v=bEv6CCg2BC8", title: "How To Get A Huge Squat With Perfect Technique (Fix Mistakes)", author: "Jeff Nippard" }, primary: ["quads", "glutes"], compound: true, step: 2.5 },
  {
    id: "bench-press",
    name: "Wyciskanie leżąc", en: "bench press", video: { url: "https://www.youtube.com/watch?v=vcBig73ojpE", title: "How To Get A Huge Bench Press with Perfect Technique", author: "Jeff Nippard" },
    primary: ["chest"],
    secondary: ["frontDelts", "triceps"],
    compound: true,
    step: 2.5,
    aliases: ["wyciskanie na laweczce", "wyciskanie na lawce"],
  },
  {
    id: "db-row",
    name: "Wiosłowanie hantlem jednorącz", en: "dumbbell row", video: { url: "https://www.youtube.com/watch?v=djKXLt7kv7Q", title: "How To Do Dumbbell Rows: Build a Thicker Back With Proper \"Cheating\"", author: "Jeff Nippard" },
    primary: ["lats", "upperBack"],
    secondary: ["biceps", "rearDelts"],
    compound: true,
    step: 2,
  },
  { id: "seated-leg-curl", name: "Uginanie nóg siedząc", en: "seated leg curl", video: { url: "https://www.youtube.com/watch?v=Orxowest56U", title: "Seated Leg Curl", author: "Renaissance Periodization" }, primary: ["hamstrings"], compound: false, step: 2.5 },
  { id: "lateral-raise", name: "Wznosy bokiem", en: "lateral raise", video: { url: "https://www.youtube.com/watch?v=v_ZkxWzYnMc", title: "How To Build Capped Shoulders: Optimal Training Explained (Side Delts)", author: "Jeff Nippard" }, primary: ["sideDelts"], compound: false, step: 1 },
  {
    id: "seated-db-curl",
    name: "Uginanie hantlami siedząc", en: "dumbbell curl", video: { url: "https://www.youtube.com/watch?v=iixND1P2lik", title: "Alternating Dumbbell Curl", author: "Renaissance Periodization" },
    primary: ["biceps"],
    compound: false,
    step: 1,
  },
  {
    id: "triceps-pushdown",
    name: "Prostowanie ramion na wyciągu", en: "triceps pushdown", video: { url: "https://www.youtube.com/watch?v=yftl1tBWmKk", title: "10 Tricep Pushdown Mistakes and How To Fix Them", author: "Renaissance Periodization" },
    primary: ["triceps"],
    compound: false,
    step: 2.5,
  },
  { id: "cable-fly", name: "Rozpiętki na wyciągu", en: "cable fly", video: { url: "https://www.youtube.com/watch?v=-EIhKMDSjBY", title: "The Best Way To Isolate The Chest For Growth (Upper Chest Focus)", author: "Jeff Nippard" }, primary: ["chest"], secondary: ["frontDelts"], compound: false, step: 2.5 },
  {
    id: "rdl",
    name: "Rumuński martwy ciąg", en: "romanian deadlift", video: { url: "https://www.youtube.com/watch?v=_oyxCn2iSjU", title: "HOW TO DO ROMANIAN DEADLIFTS (RDLs): Build Beefy Hamstrings With Perfect Technique", author: "Jeff Nippard" },
    primary: ["hamstrings", "glutes"],
    secondary: ["upperBack"],
    compound: true,
    step: 2.5,
    aliases: ["rdl"],
  },
  {
    id: "ohp",
    name: "Wyciskanie nad głowę (OHP)", en: "overhead press", video: { url: "https://www.youtube.com/watch?v=_RlRDWO2jfg", title: "Build Bigger Shoulders With Perfect Training Technique (The Overhead Press)", author: "Jeff Nippard" },
    primary: ["frontDelts"],
    secondary: ["sideDelts", "triceps"],
    compound: true,
    step: 2.5,
    aliases: ["ohp", "wyciskanie zolnierskie"],
  },
  {
    id: "pull-up",
    name: "Podciąganie", en: "pull up", video: { url: "https://www.youtube.com/watch?v=Hdc7Mw6BIEE", title: "The Best Way To Do Pull Ups For A Wide Back (Optimal Training Technique)", author: "Jeff Nippard" },
    primary: ["lats"],
    secondary: ["biceps", "upperBack"],
    compound: true,
    step: 2.5,
    added: true,
    aliases: ["podciaganie"],
  },
  { id: "leg-press", name: "Suwnica", en: "leg press", video: { url: "https://www.youtube.com/watch?v=nDh_BlnLCGc", title: "How To Leg Press With Perfect Technique", author: "Jeff Nippard" }, primary: ["quads", "glutes"], compound: true, step: 5 },
  {
    id: "dips",
    name: "Dipy", en: "dips", video: { url: "https://www.youtube.com/watch?v=yN6Q1UI_xkE", title: "How To Do Dips For A Bigger Chest and Shoulders (Fix Mistakes!)", author: "Jeff Nippard" },
    primary: ["chest", "triceps"],
    secondary: ["frontDelts"],
    compound: true,
    step: 2.5,
    added: true,
    aliases: ["deepy", "pompki na poreczach"],
  },
  {
    id: "seated-cable-row",
    name: "Wiosłowanie na wyciągu siedząc", en: "seated cable row", video: { url: "https://www.youtube.com/watch?v=UCXxvVItLoM", title: "Seated Cable Row", author: "Renaissance Periodization" },
    primary: ["upperBack", "lats"],
    secondary: ["biceps", "rearDelts"],
    compound: true,
    step: 2.5,
  },
  { id: "cable-lateral-raise", name: "Wznosy bokiem na wyciągu", en: "cable lateral raise", video: { url: "https://www.youtube.com/watch?v=f_OGBg2KxgY", title: "Stop Messing Up Lateral Raises (Easy Fix)", author: "Jeff Nippard" }, primary: ["sideDelts"], compound: false, step: 1.25 },
  {
    id: "overhead-triceps-extension",
    name: "Wyprosty ramion nad głową (wyciąg)", en: "overhead triceps extension", video: { url: "https://www.youtube.com/watch?v=1u18yJELsh0", title: "Cable Overhead Triceps Extension", author: "Renaissance Periodization" },
    primary: ["triceps"],
    compound: false,
    step: 2.5,
  },
  { id: "incline-db-curl", name: "Uginanie hantlami na ławce skośnej", en: "incline dumbbell curl", video: { url: "https://www.youtube.com/watch?v=aTYlqC_JacQ", title: "Incline Dumbbell Curl", author: "Renaissance Periodization" }, primary: ["biceps"], compound: false, step: 1 },
  { id: "standing-calf-raise", name: "Wspięcia na palce stojąc", en: "standing calf raise", video: { url: "https://www.youtube.com/watch?v=Xa18jxyeSnM", title: "8 Calf Raise Mistakes and How to Fix Them", author: "Renaissance Periodization" }, primary: ["calves"], compound: false, step: 5 },

  // — History only / swap candidates —
  {
    id: "deadlift",
    name: "Martwy ciąg klasyczny", en: "deadlift", video: { url: "https://www.youtube.com/watch?v=VL5Ab0T07e4", title: "Build A Bigger Deadlift With Perfect Technique (Conventional Form)", author: "Jeff Nippard" },
    primary: ["hamstrings", "glutes", "upperBack"],
    secondary: ["quads"],
    compound: true,
    step: 2.5,
    aliases: ["martwy ciag"],
  },
  { id: "incline-db-press", name: "Wyciskanie hantli na skosie", en: "incline dumbbell press", video: { url: "https://www.youtube.com/watch?v=GHcAIiL9J_Y", title: "8 Incline Dumbbell Press Mistakes and How to Fix Them", author: "Renaissance Periodization" }, primary: ["chest"], secondary: ["frontDelts", "triceps"], compound: true, step: 2 },
  { id: "lat-pulldown", name: "Ściąganie drążka wyciągu", en: "lat pulldown", video: { url: "https://www.youtube.com/watch?v=MyQVLFBwlJ8", title: "8 Lat Pulldown Mistakes and How to Fix Them", author: "Renaissance Periodization" }, primary: ["lats"], secondary: ["biceps", "upperBack"], compound: true, step: 2.5 },
  { id: "leg-extension", name: "Wyprosty nóg na maszynie", en: "leg extension", video: { url: "https://www.youtube.com/watch?v=xUZNOR6WP0A", title: "10 Leg Extension Mistakes and How to Fix Them", author: "Renaissance Periodization" }, primary: ["quads"], compound: false, step: 2.5 },
  { id: "hip-thrust", name: "Hip thrust", en: "hip thrust", video: { url: "https://www.youtube.com/watch?v=xDmFkJxPzeM", title: "How To Build Great Glutes with Perfect Hip Thrust Technique (Fix Mistakes!)", author: "Jeff Nippard" }, primary: ["glutes"], secondary: ["hamstrings"], compound: true, step: 5 },
  { id: "bulgarian-split-squat", name: "Przysiad bułgarski", en: "bulgarian split squat", video: { url: "https://www.youtube.com/watch?v=hPlKPjohFS0", title: "The PERFECT Bulgarian Split Squat (Avoid These Errors!)", author: "Squat University" }, primary: ["quads", "glutes"], compound: true, step: 2 },
  { id: "reverse-fly", name: "Odwrotne rozpiętki (pec deck)", en: "reverse pec deck", video: { url: "https://www.youtube.com/watch?v=5YK4bgzXDp0", title: "Machine Reverse Flye", author: "Renaissance Periodization" }, primary: ["rearDelts"], secondary: ["upperBack"], compound: false, step: 2.5 },
  { id: "face-pull", name: "Face pull", en: "face pull", video: { url: "https://www.youtube.com/watch?v=cc0tasCalHg", title: "10 Cable Face Pull Mistakes and How to Fix Them", author: "Renaissance Periodization" }, primary: ["rearDelts", "upperBack"], compound: false, step: 2.5 },
  { id: "hammer-curl", name: "Uginanie młotkowe", en: "hammer curl", video: { url: "https://www.youtube.com/watch?v=XOEL4MgekYE", title: "Hammer Curl", author: "Renaissance Periodization" }, primary: ["biceps"], compound: false, step: 1 },
  { id: "pec-deck", name: "Rozpiętki na maszynie", en: "pec deck", video: { url: "https://www.youtube.com/watch?v=O-OBCfyh9Fw", title: "Pec Deck Flye", author: "Renaissance Periodization" }, primary: ["chest"], compound: false, step: 2.5 },
  { id: "seated-calf-raise", name: "Wspięcia na palce siedząc", en: "seated calf raise", video: { url: "https://www.youtube.com/watch?v=Xa18jxyeSnM", title: "8 Calf Raise Mistakes and How to Fix Them", author: "Renaissance Periodization" }, primary: ["calves"], compound: false, step: 5 },
  { id: "cable-crunch", name: "Spięcia brzucha na wyciągu", en: "cable crunch", video: { url: "https://www.youtube.com/watch?v=6GMKPQVERzw", title: "Rope Crunch", author: "Renaissance Periodization" }, primary: ["abs"], compound: false, step: 2.5 },
  // — Calisthenics (plan C) —
  { id: "push-up", name: "Pompki", en: "push up", video: { url: "https://www.youtube.com/watch?v=IODxDxX7oi4", title: "The Perfect Push Up | Do it right!", author: "Calisthenicmovement" }, primary: ["chest", "triceps"], secondary: ["frontDelts"], compound: true, step: 2.5, added: true, aliases: ["pompka"] },
  { id: "inverted-row", name: "Wiosłowanie australijskie", en: "inverted row", video: { url: "https://www.youtube.com/watch?v=KOaCM1HMwU0", title: "Inverted Row", author: "Renaissance Periodization" }, primary: ["upperBack", "lats"], secondary: ["biceps", "rearDelts"], compound: true, step: 2.5, added: true, aliases: ["podciaganie australijskie"] },
  { id: "pike-push-up", name: "Pompki w pike (na barki)", en: "pike push up", video: { url: "https://www.youtube.com/watch?v=DG-NcMnfZ_0", title: "Instant Pike Push-Up Fix (Do More Reps)", author: "FitnessFAQs" }, primary: ["frontDelts"], secondary: ["triceps", "sideDelts"], compound: true, step: 2.5, added: true },
  { id: "bw-split-squat", name: "Przysiad bułgarski bez obciążenia", en: "bulgarian split squat", video: { url: "https://www.youtube.com/watch?v=hPlKPjohFS0", title: "The PERFECT Bulgarian Split Squat (Avoid These Errors!)", author: "Squat University" }, primary: ["quads", "glutes"], compound: true, step: 2, added: true },
  { id: "single-leg-hip-thrust", name: "Unoszenie bioder jednonóż", en: "single leg hip thrust", video: { url: "https://www.youtube.com/watch?v=lzDgRRuBdqY", title: "Single Leg Hip Thrust", author: "Renaissance Periodization" }, primary: ["glutes"], secondary: ["hamstrings"], compound: false, step: 2.5, added: true, aliases: ["mostek biodrowy jednonoz"] },
  { id: "chin-up", name: "Podciąganie podchwytem", en: "chin up", video: { url: "https://www.youtube.com/watch?v=9JC1EwqezGY", title: "Underhand Pullup", author: "Renaissance Periodization" }, primary: ["lats", "biceps"], secondary: ["upperBack"], compound: true, step: 2.5, added: true },
  { id: "hanging-leg-raise", name: "Unoszenie nóg w zwisie", en: "hanging leg raise", video: { url: "https://www.youtube.com/watch?v=VUeSO_Y6Yxk", title: "Hanging Leg Raises: Increased Abdominal Recruitment", author: "FitnessFAQs" }, primary: ["abs"], compound: false, step: 0, added: true },
]

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

const CUSTOM_KEY = "gt5custom"

/** Exercises the user added themselves (test slot). Muscles chosen when adding. */
export function loadCustomExercises(): ExerciseDef[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]")
  } catch {
    return []
  }
}

export function saveCustomExercise(def: ExerciseDef) {
  const all = loadCustomExercises().filter((e) => e.id !== def.id)
  localStorage.setItem(CUSTOM_KEY, JSON.stringify([...all, def]))
}

export function getExercise(id: string | undefined): ExerciseDef | undefined {
  if (!id) return undefined
  return BY_ID.get(id) ?? loadCustomExercises().find((e) => e.id === id)
}

/** Lowercase, no diacritics, no "(4x5/6)" / "3 x 12-15" set schemes. */
export function normalizeName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/\(.*?\)/g, " ")
    .replace(/\d+\s*x\s*[\d\s/–-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Maps a history entry name to a library id, if it's a known exercise. */
export function resolveExerciseId(name: string, id?: string): string | undefined {
  if (id) return id
  const n = normalizeName(name)
  if (!n) return undefined
  for (const e of [...EXERCISES, ...loadCustomExercises()]) {
    if (normalizeName(e.name) === n || e.aliases?.some((a) => normalizeName(a) === n)) return e.id
  }
  return undefined
}

/**
 * Technique link. Every library exercise has a verified video; only custom
 * exercises fall back to a YouTube search for a technique video.
 */
export function techniqueUrl(def: ExerciseDef) {
  if (def.video) return def.video.url
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${def.en || def.name} technique`)}`
}

export function restSeconds(def: ExerciseDef | undefined, paired: boolean) {
  if (paired) return 90
  return def?.compound ? 180 : 90
}
