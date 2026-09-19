"use client"

import * as React from "react"

import type { User } from "@adminprop/shared-types"

import { useSession } from "./session-provider"

export interface ProtectedRouteProps {
  children: React.ReactNode
  /** Login al que se manda si no hay sesión (con `?next=` a la ruta actual). */
  loginPath: string
  /** Mientras se valida la sesión. */
  fallback: React.ReactNode
  /** Si no se pudo validar (red, API caída). Recibe cómo reintentar. */
  renderError: (retry: () => void) => React.ReactNode
  /**
   * Quién puede ver esta parte. Un usuario logueado que no cumple se trata
   * como sin sesión para esta sección (ej. un inquilino en el portal de
   * propietarios): va a este login.
   */
  allow?: (user: User) => boolean
  /** Para tests: por defecto, navegación del navegador. */
  navigate?: (url: string) => void
}

/**
 * Valida la sesión antes de mostrar una sección (spec Fase 4, 6). Sin sesión,
 * al login; con sesión de otro tipo de usuario, también.
 *
 * El proxy de cada app ya corta antes a quien no tiene la cookie: esto cubre
 * la cookie vencida o revocada y el caso del rol equivocado.
 */
export function ProtectedRoute({
  children,
  loginPath,
  fallback,
  renderError,
  allow,
  navigate = (url) => window.location.replace(url),
}: ProtectedRouteProps) {
  const { status, user, ensure } = useSession()

  React.useEffect(() => {
    void ensure()
  }, [ensure])

  const allowed =
    status === "authenticated" && user !== null && (!allow || allow(user))
  const mustLeave =
    status === "unauthenticated" ||
    (status === "authenticated" && user !== null && !allowed)

  React.useEffect(() => {
    if (!mustLeave) return
    const { pathname, search } = window.location
    navigate(`${loginPath}?next=${encodeURIComponent(pathname + search)}`)
  }, [mustLeave, loginPath, navigate])

  if (allowed) return <>{children}</>
  if (status === "error") return <>{renderError(() => void ensure())}</>
  return <>{fallback}</>
}
