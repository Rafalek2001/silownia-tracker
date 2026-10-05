import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
}

const ConfirmContext = createContext<(o: ConfirmOptions) => Promise<boolean>>(async () => false)

/** Promise-based replacement for window.confirm, styled with the app's Dialog. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(v: boolean) => void>(() => {})

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o)
    return new Promise<boolean>((res) => (resolver.current = res))
  }, [])

  const close = (v: boolean) => {
    resolver.current(v)
    setOpts(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!opts} onOpenChange={(o) => !o && close(false)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-xl">
          <DialogHeader className="text-left">
            <DialogTitle>{opts?.title}</DialogTitle>
            {opts?.description && <DialogDescription>{opts.description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:space-x-0">
            <Button variant="outline" className="h-11 flex-1" onClick={() => close(false)}>
              Anuluj
            </Button>
            <Button
              variant={opts?.destructive ? "destructive" : "default"}
              className="h-11 flex-1"
              onClick={() => close(true)}
            >
              {opts?.confirmLabel ?? "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)
