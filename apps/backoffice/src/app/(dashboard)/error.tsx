"use client"

import Link from "next/link"

import { Button } from "@adminprop/ui/components/button"
import { ErrorState } from "@adminprop/ui/components/error-state"

/** Error dentro del tablero: el menú queda a la vista y se puede reintentar. */
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Algo salió mal"
      description="No pudimos mostrar esta pantalla. Probá de nuevo; si sigue pasando, avisale a un administrador."
      onRetry={reset}
      action={
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Volver al inicio</Link>
        </Button>
      }
    />
  )
}
