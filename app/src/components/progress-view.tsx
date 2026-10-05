import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart } from "@/components/line-chart"
import type { GymStore } from "@/hooks/use-gym-store"
import { exerciseOptions, progress, type ProgressPoint } from "@/lib/stats"

const METRICS: { key: keyof ProgressPoint; label: string; unit: string }[] = [
  { key: "maxKg", label: "Maksymalny ciężar", unit: "kg" },
  { key: "e1rm", label: "Szacowany 1RM (Epley)", unit: "kg" },
  { key: "volume", label: "Objętość", unit: "kg × powt." },
  { key: "maxReps", label: "Maks. powtórzeń", unit: "powt." },
]

export function ProgressView({ store }: { store: GymStore }) {
  const options = exerciseOptions(store.history)
  const [name, setName] = useState("")
  useEffect(() => {
    if (name && !options.some((o) => o.key === name)) setName("")
  }, [options, name])

  const pts = name ? progress(store.history, name) : []
  const hasKg = pts.some((p) => p.maxKg !== null)
  const metrics = METRICS.filter(
    (m) => pts.some((p) => p[m.key] !== null) && (m.key !== "maxReps" || !hasKg), // reps chart only for bodyweight
  )
  const color = "hsl(var(--primary))"

  if (!options.length)
    return <p className="py-10 text-center text-sm text-muted-foreground">Zrób pierwszy trening, żeby zobaczyć progres.</p>

  return (
    <div className="space-y-3">
      <Select value={name} onValueChange={setName}>
        <SelectTrigger className="h-11 text-base" aria-label="Ćwiczenie">
          <SelectValue placeholder="Wybierz ćwiczenie" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.key} value={o.key} className="h-11 text-base">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!name && <p className="py-8 text-center text-sm text-muted-foreground">Wybierz ćwiczenie, aby zobaczyć progres.</p>}
      {name && !pts.length && <p className="py-8 text-center text-sm text-muted-foreground">Brak danych dla tego ćwiczenia.</p>}

      {metrics.map((m) => (
        <Card key={m.key} className="p-4">
          <div className="mb-2 text-xs font-medium text-muted-foreground">{m.label}</div>
          <LineChart labels={pts.map((p) => p.date)} values={pts.map((p) => p[m.key] as number | null)} color={color} unit={m.unit} />
        </Card>
      ))}
    </div>
  )
}
