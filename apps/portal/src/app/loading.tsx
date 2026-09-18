import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageSkeleton cards={6} />
    </div>
  )
}
