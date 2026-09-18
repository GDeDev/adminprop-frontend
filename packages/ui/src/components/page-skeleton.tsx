import { Skeleton } from "@adminprop/ui/components/skeleton"

/** Skeleton genérico de pantalla (título + tarjetas) para loading.tsx. */
function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
      aria-label="Cargando…"
    >
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export { PageSkeleton }
