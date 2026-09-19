import * as React from "react"
import { cn } from "cn"
import type { LucideIcon } from "lucide-react"

/**
 * Estado vacío (ADMINPROP-UI.md, "Componentes propios"): qué falta
 * (`title`), por qué (`description`) y el botón que lo resuelve (`action`).
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon aria-hidden className="size-6" />
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
