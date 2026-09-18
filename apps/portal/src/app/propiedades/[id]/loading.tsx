import { Skeleton } from "@adminprop/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="aspect-video w-full rounded-xl" />
    </div>
  )
}
