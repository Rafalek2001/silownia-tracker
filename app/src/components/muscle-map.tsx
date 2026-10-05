import type { ReactNode } from "react"
import { MUSCLES, type Muscle } from "@/lib/exercises"
import type { MuscleSets } from "@/lib/stats"
import { cn } from "@/lib/utils"

// Anatomical line-art figure, front and back, in a 200×430 box centred on x=100.
// Shapes are drawn for the left side and mirrored (x → 200 − x).

const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - Number(x)} ${y}`)
const both = (...ds: string[]) => ds.flatMap((d) => [d, mirror(d)])

/** Body contour (left half, open path from neck to crotch). */
const OUTLINE_SIDE =
  "M89 54 C88 60 86 66 80 69 C74 71 68 72 63 76 C54 81 50 92 50 106 C49 122 47 138 46 152 C43 168 39 186 37 206 C33 214 31 224 33 234 C35 240 41 240 43 233 C44 226 44 218 45 212 C49 194 54 176 57 160 C60 146 62 132 64 120 C66 136 68 152 70 168 C70 178 68 188 67 198 C63 226 63 258 68 294 C69 302 69 310 67 320 C64 342 66 364 72 386 C73 394 72 400 70 406 C67 412 71 417 79 416 C86 416 92 414 92 408 C91 400 89 394 89 386 C91 362 92 340 91 318 C90 310 91 302 93 294 C96 268 98 244 99 222"

const HEAD = "M100 10 C111 10 118 19 118 31 C118 43 111 53 100 53 C89 53 82 43 82 31 C82 19 89 10 100 10 Z"

type Region = Partial<Record<Muscle | "none", string[]>>

const FRONT: Region = {
  sideDelts: both("M63 77 C55 82 51 92 51 106 C54 104 56 99 58 93 C59 86 61 81 63 77 Z"),
  frontDelts: both("M66 76 C62 81 59 88 59 95 C62 99 67 99 71 95 C73 88 72 81 66 76 Z"),
  chest: both("M72 82 C81 78 92 79 99 83 L99 108 C90 114 79 113 71 106 C67 100 68 90 72 82 Z"),
  biceps: both("M59 103 C55 112 53 126 55 140 C58 143 62 141 63 136 C65 124 65 112 63 103 Z"),
  abs: [
    ...both(
      "M89 113 L98 113 L98 126 L89 127 C88 122 88 117 89 113 Z",
      "M89 130 L98 129 L98 143 L89 144 C88 139 88 134 89 130 Z",
      "M89 147 L98 146 L98 160 L90 161 C89 156 89 151 89 147 Z",
      "M90 164 L98 163 L98 186 C94 182 91 174 90 164 Z",
      "M72 112 C77 126 80 146 83 166 C85 170 88 170 87 164 C86 146 86 128 86 114 C81 116 76 115 72 112 Z",
    ),
  ],
  quads: both(
    "M69 202 C64 228 64 262 69 292 C73 291 76 286 77 278 C76 252 75 226 75 206 Z",
    "M77 204 C79 228 80 254 80 278 C84 282 88 282 90 276 C92 252 91 228 88 208 C84 204 80 203 77 204 Z",
    "M91 262 C88 276 87 288 89 297 C93 299 96 295 96 287 C96 277 94 268 91 262 Z",
  ),
  calves: both("M69 322 C66 336 66 352 70 366 C73 360 74 346 74 330 Z"),
  none: both(
    "M57 158 C51 172 46 188 43 204 L47 206 C51 190 56 174 59 160 Z", // forearm
    "M91 212 C94 228 96 244 96 258 C99 246 99 230 98 220 Z", // adductors
    "M78 320 C80 342 81 364 81 384 L85 384 C87 362 87 340 85 318 Z", // shin
  ),
}

const BACK: Region = {
  upperBack: [
    "M100 56 C95 62 86 68 70 74 C80 82 89 93 93 110 L100 134 L107 110 C111 93 120 82 130 74 C114 68 105 62 100 56 Z",
    ...both("M72 92 C80 90 88 96 92 105 C88 113 80 117 72 113 C70 106 70 98 72 92 Z"),
  ],
  sideDelts: both("M62 77 C54 81 50 91 50 106 C53 104 55 98 57 92 C58 86 60 81 62 77 Z"),
  rearDelts: both("M65 76 C61 81 58 88 58 95 C62 97 67 96 70 92 C71 86 69 80 65 76 Z"),
  lats: both("M70 117 C78 121 88 126 95 140 L95 168 C88 172 80 172 76 168 C72 152 69 134 70 117 Z"),
  triceps: both("M59 102 C55 112 53 126 55 142 C59 144 62 140 64 134 C65 122 64 110 63 102 Z"),
  glutes: both("M70 188 C76 180 90 180 99 188 L99 216 C90 224 76 222 70 214 C67 206 67 196 70 188 Z"),
  hamstrings: both(
    "M70 222 C66 246 68 272 74 294 C78 292 82 284 82 276 C82 254 80 238 78 224 Z",
    "M82 226 C84 248 86 268 86 286 C90 290 94 286 95 280 C96 258 96 238 96 226 Z",
  ),
  calves: both(
    "M70 314 C64 328 64 346 70 360 C76 358 80 348 80 336 C80 324 76 316 70 314 Z",
    "M82 316 C88 322 92 336 90 352 C86 358 81 354 80 344 C80 332 80 322 82 316 Z",
  ),
  none: both(
    "M94 140 L99 146 L99 184 L94 184 Z", // lower back
    "M57 158 C51 172 46 188 43 204 L47 206 C51 190 56 174 59 160 Z", // forearm
  ),
}

const FILL = ["transparent", "hsl(var(--muscle) / 0.45)", "hsl(var(--muscle) / 0.85)", "hsl(var(--muscle-max))"]

function Figure({ regions, levelOf, label }: { regions: Region; levelOf: (m: Muscle) => number; label: string }) {
  return (
    <figure className="flex flex-1 flex-col items-center gap-1.5">
      <svg viewBox="24 4 152 420" className="h-auto w-full max-w-[9.5rem]" aria-hidden>
        <g fill="none" stroke="hsl(var(--foreground) / 0.55)" strokeWidth="1.3" strokeLinejoin="round">
          <path d={HEAD} />
          <path d={OUTLINE_SIDE} fill="none" />
          <path d={mirror(OUTLINE_SIDE)} fill="none" />
        </g>
        <g stroke="hsl(var(--foreground) / 0.4)" strokeWidth="0.9" strokeLinejoin="round">
          {(Object.entries(regions) as [Muscle | "none", string[]][]).map(([m, ds]) => {
            const lvl = m === "none" ? 0 : levelOf(m)
            return ds.map((d, i) => (
              <path key={`${m}-${i}`} d={d} fill={FILL[lvl]} className="transition-[fill] duration-300" />
            ))
          })}
        </g>
      </svg>
      <figcaption className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</figcaption>
    </figure>
  )
}

interface MuscleMapProps {
  sets: MuscleSets
  /** Upper bounds of levels 1 and 2; above the second is level 3 (highlighted). */
  thresholds: [number, number]
  legend: [string, string, string]
  className?: string
  footer?: ReactNode
}

export function MuscleMap({ sets, thresholds: [a, b], legend, className, footer }: MuscleMapProps) {
  const levelOf = (m: Muscle) => {
    const v = sets[m] ?? 0
    return v <= 0 ? 0 : v < a ? 1 : v < b ? 2 : 3
  }
  const worked = (Object.keys(MUSCLES) as Muscle[]).filter((m) => sets[m] > 0)
  const description = worked.length
    ? worked.map((m) => `${MUSCLES[m]}: ${Math.round(sets[m] * 10) / 10} serii`).join(", ")
    : "Brak serii"

  return (
    <div className={cn("space-y-3", className)} role="img" aria-label={`Mapa mięśni. ${description}`}>
      <div className="flex justify-center gap-4">
        <Figure regions={FRONT} levelOf={levelOf} label="Przód" />
        <Figure regions={BACK} levelOf={levelOf} label="Tył" />
      </div>
      <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
        {legend.map((l, i) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border border-foreground/30" style={{ background: FILL[i + 1] }} />
            {l}
          </span>
        ))}
      </div>
      {footer}
    </div>
  )
}
