"use client"

import Link from "next/link"
import { ShieldOff } from "lucide-react"

import { useSession } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"

/**
 * «Mi sitio web» es solo para administradores. El menú ya no la muestra a un
 * empleado, pero alcanza con escribir la dirección: sin esta guarda vería la
 * pantalla llena de errores 403 (la API igual lo frena).
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, status } = useSession()

  // Mientras se recupera la sesión no se sabe el rol: no mostrar nada todavía.
  if (!user && (status === "idle" || status === "loading")) return null

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        icon={ShieldOff}
        title="Sólo para administradores"
        description="Pedile a un administrador de la inmobiliaria que gestione el sitio web."
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard">Volver al inicio</Link>
          </Button>
        }
      />
    )
  }

  return children
}
