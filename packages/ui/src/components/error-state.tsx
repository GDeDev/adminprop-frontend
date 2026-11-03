import * as React from "react"
import { cn } from "cn"
import { TriangleAlert } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"

/**
 * Estado de error (carga fallida de un listado, ficha o sección): mismo
 * lugar que `EmptyState`, pero con ícono de alerta, `role="alert"` y el botón
 * "Reintentar" opcional. Nunca mostrar acá errores crudos de la API: pasar un
 * texto en español (ver `apiErrorMessage`).
 */
function ErrorState({
  title = "No se pudo cargar",
  description = "Probá de nuevo en un rato.",
  onRetry,
  retryLabel = "Reintentar",
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode
  description?: React.ReactNode
  onRetry?: () => void
  retryLabel?: string
  /** Acción propia (por ejemplo "Volver al listado"), junto a "Reintentar". */
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-card px-6 py-10 text-center",
        className
      )}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert aria-hidden className="size-6" />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {(onRetry || action) && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  )
}

export { ErrorState }
