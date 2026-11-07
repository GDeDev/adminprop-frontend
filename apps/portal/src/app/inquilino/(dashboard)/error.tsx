"use client"

import { ErrorState } from "@adminprop/ui/components/error-state"

/** Error dentro del portal: el menú queda a la vista y se puede reintentar. */
export default function PortalDashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Algo salió mal"
      description="No pudimos mostrar esta pantalla. Probá de nuevo en un momento."
      onRetry={reset}
    />
  )
}
