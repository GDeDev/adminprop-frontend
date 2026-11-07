"use client"

import Link from "next/link"

import { Button } from "@adminprop/ui/components/button"
import { ErrorState } from "@adminprop/ui/components/error-state"

/** Error inesperado de una pantalla: se puede reintentar sin perder la sesión. */
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-4 py-10">
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
    </main>
  )
}
