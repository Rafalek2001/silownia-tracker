import { useMemo, useState } from "react"
import { Check, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { GymStore } from "@/hooks/use-gym-store"
import { markReviewed, reviewDue, weeklyReview } from "@/lib/review"
import { cn } from "@/lib/utils"

/** Once a week: what happened, plus plan tweaks to accept with one tap. */
export function ReviewCard({ store }: { store: GymStore }) {
  const [closed, setClosed] = useState(false)
  const due = !closed && !store.session && reviewDue(store.history)
  const items = useMemo(() => (due ? weeklyReview(store.history, store.plan) : []), [due, store.history, store.plan])
  const actionable = items.filter((i) => i.action)
  const [off, setOff] = useState<string[]>([])
  if (!due) return null

  const apply = () => {
    const chosen = actionable.filter((i) => !off.includes(i.key)).map((i) => i.action!)
    store.applyReview(chosen)
    setClosed(true)
    toast.success(chosen.length ? `Plan dopasowany (${chosen.length})` : "Przegląd zrobiony")
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Przegląd tygodnia</h3>
      </div>
      <ul className="space-y-2">
        {items.map((i) => {
          const on = !!i.action && !off.includes(i.key)
          const body = (
            <>
              <span className="block text-sm font-medium">{i.title}</span>
              <span className="block text-xs text-muted-foreground">{i.detail}</span>
            </>
          )
          return (
            <li key={i.key}>
              {i.action ? (
                <button
                  onClick={() => setOff((o) => (on ? [...o, i.key] : o.filter((k) => k !== i.key)))}
                  className="flex w-full items-start gap-3 rounded-lg border p-3 text-left"
                  aria-pressed={on}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border",
                      on && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {on && <Check className="size-3.5" />}
                  </span>
                  <span>{body}</span>
                </button>
              ) : (
                <div className="px-1">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
      <div className="flex gap-2">
        {actionable.length > 0 && (
          <Button
            variant="ghost"
            className="h-11 flex-1"
            onClick={() => {
              markReviewed()
              setClosed(true)
            }}
          >
            Bez zmian
          </Button>
        )}
        <Button className="h-11 flex-1" onClick={apply}>
          {actionable.length ? "Zastosuj zaznaczone" : "OK"}
        </Button>
      </div>
    </Card>
  )
}
