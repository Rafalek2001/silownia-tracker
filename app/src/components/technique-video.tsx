import { useState, type ReactNode } from "react"
import { Drawer as Vaul } from "vaul"
import { ExternalLink } from "lucide-react"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { techniqueUrl, type ExerciseDef } from "@/lib/exercises"

/** Video id + start time from a watch?v= / youtu.be / shorts URL. */
export function parseYouTube(url: string) {
  try {
    const u = new URL(url)
    const id = u.searchParams.get("v") ?? u.pathname.match(/\/(?:shorts|embed)\/([\w-]+)/)?.[1] ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null)
    const t = u.searchParams.get("t")
    return id ? { id, start: t ? parseInt(t, 10) || 0 : 0 } : null
  } catch {
    return null
  }
}

/**
 * Opens the exercise's technique video inside the app, so the user always lands
 * on that exact video (no YouTube app redirect to the channel page).
 */
export function TechniqueVideo({ def, children, nested }: { def: ExerciseDef; children: ReactNode; nested?: boolean }) {
  const [open, setOpen] = useState(false)
  const yt = def.video ? parseYouTube(def.video.url) : null

  // custom exercises without a video: plain link to a YouTube technique search
  if (!yt)
    return (
      <a href={techniqueUrl(def)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
        {children}
      </a>
    )

  const src = `https://www.youtube-nocookie.com/embed/${yt.id}?playsinline=1&rel=0&modestbranding=1${yt.start ? `&start=${yt.start}` : ""}`

  // inside another drawer (plan item) vaul needs a nested root
  const Root = nested ? Vaul.NestedRoot : Drawer
  return (
    <Root open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DrawerTrigger>
      <DrawerContent onClick={(e) => e.stopPropagation()}>
        <DrawerHeader className="text-left">
          <DrawerTitle>Jak wykonać: {def.name}</DrawerTitle>
          <DrawerDescription>
            {def.video!.author} · {def.video!.title}
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            {open && (
              <iframe
                src={src}
                title={`${def.name} — technika`}
                className="size-full"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </div>
          <a
            href={def.video!.url}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center justify-center gap-1.5 text-sm text-muted-foreground"
          >
            <ExternalLink className="size-4" /> Otwórz w YouTube
          </a>
        </div>
      </DrawerContent>
    </Root>
  )
}
