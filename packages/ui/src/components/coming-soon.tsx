import * as React from "react"
import { cn } from "cn"
import { Construction } from "lucide-react"

import { EmptyState } from "@adminprop/ui/components/empty-state"

/** Placeholder de pantalla todavía no implementada. */
function ComingSoon({
  title,
  description = "Próximamente.",
  className,
}: {
  title: string
  description?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h1>
      <EmptyState
        icon={Construction}
        title="Próximamente"
        description={description}
      />
    </div>
  )
}

export { ComingSoon }
