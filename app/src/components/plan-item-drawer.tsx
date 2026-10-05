import { CircleHelp, Minus, Plus, Repeat, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useConfirm } from "@/components/confirm-dialog"
import type { GymStore } from "@/hooks/use-gym-store"
import { getExercise, MUSCLES, techniqueUrl } from "@/lib/exercises"
import type { Plan } from "@/lib/storage"

interface PlanItemDrawerProps {
  store: GymStore
  plan: Plan
  index: number | null
  onClose: () => void
  onSwap: (index: number) => void
}

/** Tap an exercise in the plan: technique, sets, swap or remove. */
export function PlanItemDrawer({ store, plan, index, onClose, onSwap }: PlanItemDrawerProps) {
  const confirm = useConfirm()
  const item = index === null ? undefined : store.plan[plan].items[index]
  const def = getExercise(item?.id)

  return (
    <Drawer open={!!item} onOpenChange={(o) => !o && onClose()} shouldScaleBackground={false}>
      <DrawerContent>
        {item && index !== null && (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle>{def?.name ?? item.id}</DrawerTitle>
              <DrawerDescription>
                {def ? [...def.primary, ...(def.secondary ?? [])].map((m) => MUSCLES[m]).join(", ") : ""}
                {" · "}
                {item.reps[0]}–{item.reps[1]} powt. · RIR {item.rir}
              </DrawerDescription>
            </DrawerHeader>
            <div className="space-y-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between rounded-xl border p-2 pl-4">
                <span className="text-sm font-medium">Serie</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label="Mniej serii"
                    disabled={item.sets <= 1}
                    onClick={() => store.setPlanSets(plan, index, item.sets - 1)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-8 text-center font-mono text-lg font-semibold tabular">{item.sets}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label="Więcej serii"
                    disabled={item.sets >= 8}
                    onClick={() => store.setPlanSets(plan, index, item.sets + 1)}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
              {def && (
                <Button asChild variant="outline" className="h-12 w-full justify-start">
                  <a href={techniqueUrl(def)} target="_blank" rel="noreferrer">
                    <CircleHelp /> Jak wykonać (Jeff Nippard)
                  </a>
                </Button>
              )}
              <Button variant="outline" className="h-12 w-full justify-start" onClick={() => onSwap(index)}>
                <Repeat /> Wymień na inne
              </Button>
              <Button
                variant="ghost"
                className="h-12 w-full justify-start text-destructive hover:text-destructive"
                onClick={async () => {
                  if (
                    await confirm({
                      title: `Usunąć z planu ${plan}?`,
                      description: `${def?.name ?? item.id} zniknie z planu. Historia zostaje.`,
                      confirmLabel: "Usuń",
                      destructive: true,
                    })
                  ) {
                    store.removePlanItem(plan, index)
                    onClose()
                  }
                }}
              >
                <Trash2 /> Usuń z planu
              </Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
