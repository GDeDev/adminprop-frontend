import * as React from "react"
import { cn } from "cn"
import { TriangleAlert } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"

/**
 * Error de carga de una sección dentro de una pantalla (versión compacta de
 * `ErrorState`): `role="alert"`, ícono, texto y "Reintentar" en una sola fila.
 * Pasar un texto en español (ver `apiErrorMessage`), nunca el error crudo.
 */
function SectionError({
  title = "No se pudo cargar esta sección",
  description,
  onRetry,
  retryLabel = "Reintentar",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode
  description?: React.ReactNode
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div
      data-slot="section-error"
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-destructive/30 bg-card px-4 py-3 sm:flex-row sm:items-center",
        className
      )}
      {...props}
    >
      <TriangleAlert aria-hidden className="size-5 shrink-0 text-destructive" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

export { SectionError }
