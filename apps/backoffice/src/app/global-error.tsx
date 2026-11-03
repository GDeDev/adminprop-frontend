"use client"

import "@adminprop/ui/globals.css"

import { ErrorState } from "@adminprop/ui/components/error-state"

/**
 * Último recurso: falló el layout raíz. Reemplaza al `<html>`, así que no hay
 * proveedores ni fuentes; alcanza con el mensaje y "Reintentar".
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body>
        <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-4 py-10">
          <ErrorState
            title="Algo salió mal"
            description="La aplicación tuvo un problema inesperado. Probá de nuevo; si sigue pasando, avisale a un administrador."
            onRetry={reset}
          />
        </main>
      </body>
    </html>
  )
}
