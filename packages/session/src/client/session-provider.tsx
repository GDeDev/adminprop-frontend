"use client"

import * as React from "react"
import type { AxiosInstance } from "axios"

import type { ApiSuccess, AuthResult, User } from "@adminprop/shared-types"

import {
  DEFAULT_SESSION_PATH,
  endSession,
  refreshAccessToken,
  startSession,
} from "./session-client"
import { tokenStore } from "./token-store"

export type SessionStatus =
  "idle" | "loading" | "authenticated" | "unauthenticated" | "error"

export interface SessionContextValue {
  status: SessionStatus
  user: User | null
  /**
   * Recupera la sesión si hace falta (al recargar, el access token en memoria
   * se perdió pero la cookie sigue). Idempotente: lo llaman las rutas
   * protegidas al montarse.
   */
  ensure: () => Promise<void>
  /** Después de un login exitoso contra la API: guarda la sesión. */
  signIn: (result: AuthResult) => Promise<void>
  /** Cierra la sesión y lleva al login. */
  signOut: () => Promise<void>
  /** Para refrescar los datos del usuario después de editarlos. */
  setUser: (user: User) => void
}

const SessionContext = React.createContext<SessionContextValue | null>(null)

export interface SessionProviderProps {
  children: React.ReactNode
  /** Cliente de `createApiClient`: con él se pide `/auth/me`. */
  apiClient: AxiosInstance
  /** A dónde ir después de cerrar sesión. */
  loginPath: string
  sessionPath?: string
  /** Para limpiar cachés (React Query) al cerrar sesión. */
  onSignOut?: () => void
}

export function SessionProvider({
  children,
  apiClient,
  loginPath,
  sessionPath = DEFAULT_SESSION_PATH,
  onSignOut,
}: SessionProviderProps) {
  const [status, setStatusState] = React.useState<SessionStatus>("idle")
  const [user, setUser] = React.useState<User | null>(null)
  const pending = React.useRef<Promise<void> | null>(null)
  // Copia del estado para `ensure`, que no puede depender de `status`: si lo
  // hiciera, cambiaría en cada transición y las rutas protegidas volverían a
  // llamarlo en su efecto.
  const statusRef = React.useRef<SessionStatus>("idle")
  const setStatus = React.useCallback((next: SessionStatus) => {
    statusRef.current = next
    setStatusState(next)
  }, [])

  const ensure = React.useCallback(() => {
    if (statusRef.current === "authenticated") return Promise.resolve()

    pending.current ??= (async () => {
      setStatus("loading")
      try {
        if (!tokenStore.get()) {
          const refreshed = await refreshAccessToken(sessionPath)
          if (refreshed.status !== "ok") {
            setStatus(
              refreshed.status === "error" ? "error" : "unauthenticated"
            )
            return
          }
        }
        const { data } = await apiClient.get<ApiSuccess<User>>("/auth/me")
        setUser(data.data)
        setStatus("authenticated")
      } catch {
        // Un 401 acá ya lo resolvió el interceptor (redirige al login).
        setStatus(tokenStore.get() ? "error" : "unauthenticated")
      } finally {
        pending.current = null
      }
    })()

    return pending.current
  }, [apiClient, sessionPath, setStatus])

  const signIn = React.useCallback(
    async (result: AuthResult) => {
      await startSession(result.tokens, sessionPath)
      setUser(result.user)
      setStatus("authenticated")
    },
    [sessionPath, setStatus]
  )

  const signOut = React.useCallback(async () => {
    await endSession(sessionPath)
    onSignOut?.()
    setUser(null)
    setStatus("unauthenticated")
    // Navegación completa a propósito: no queda nada de la sesión anterior en
    // memoria (cachés, estado de formularios) para el próximo que entre.
    window.location.assign(loginPath)
  }, [loginPath, onSignOut, sessionPath, setStatus])

  const value = React.useMemo<SessionContextValue>(
    () => ({ status, user, ensure, signIn, signOut, setUser }),
    [status, user, ensure, signIn, signOut]
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const context = React.useContext(SessionContext)
  if (!context) {
    throw new Error("useSession tiene que usarse dentro de <SessionProvider>")
  }
  return context
}
