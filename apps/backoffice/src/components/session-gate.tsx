"use client"

import { WifiOff } from "lucide-react"

import { ProtectedRoute } from "@adminprop/session/client"
import type { User } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { LOGIN_PATH } from "@/lib/session"

/** El backoffice es para admins y empleados; a un propietario lo manda al login. */
const isStaff = (user: User) =>
  user.role === "ADMIN" || user.role === "EMPLOYEE"

/**
 * Pantallas logueadas del backoffice: valida la sesión antes de mostrarlas
 * (spec Fase 4, 6, `<ProtectedRoute>`).
 */
export function SessionGate({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute
      loginPath={LOGIN_PATH}
      allow={isStaff}
      fallback={
        <div className="px-4 pt-6 md:px-8 md:pt-8">
          <PageSkeleton />
        </div>
      }
      renderError={(retry) => (
        <div className="flex min-h-svh items-center justify-center px-4">
          <EmptyState
            icon={WifiOff}
            title="No pudimos validar tu sesión"
            description="No hay conexión con el servidor. Revisá tu conexión y probá de nuevo."
            action={<Button onClick={retry}>Reintentar</Button>}
          />
        </div>
      )}
    >
      {children}
    </ProtectedRoute>
  )
}
