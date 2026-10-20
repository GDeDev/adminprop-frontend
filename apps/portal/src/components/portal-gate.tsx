"use client"

import { WifiOff } from "lucide-react"

import { ProtectedRoute } from "@adminprop/session/client"
import type { PortalRole } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { PORTAL_AREAS } from "@/lib/session"

/**
 * Área logueada del portal: sólo para el rol de esa área. Un inquilino que
 * abre el portal de propietarios va al login de propietarios.
 */
export function PortalGate({
  role,
  children,
}: {
  role: PortalRole
  children: React.ReactNode
}) {
  const area = PORTAL_AREAS[role]

  return (
    <ProtectedRoute
      loginPath={area.loginPath}
      allow={(user) => user.role === area.apiType}
      fallback={
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 md:px-8 md:pt-8">
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
