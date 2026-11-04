"use client"

import * as React from "react"
import Link from "next/link"
import { TriangleAlert } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"

/**
 * Último recurso si una pantalla falla al renderizar: en vez de la página de
 * error pelada de Next, un estado con la marca y una salida. Queda dentro del
 * shell (sidebar / BottomNav), que no se vuelve a montar.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-lg items-center">
      <EmptyState
        role="alert"
        icon={TriangleAlert}
        title="Algo salió mal"
        description="No pudimos mostrar esta pantalla. Probá de nuevo; si sigue pasando, avisanos."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>Reintentar</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Ir al inicio</Link>
            </Button>
          </div>
        }
        className="w-full"
      />
    </div>
  )
}
