import axios, { type AxiosError, type AxiosInstance } from "axios"

import type { ApiError } from "@adminprop/shared-types"

import { DEFAULT_SESSION_PATH, refreshAccessToken } from "./session-client"
import { tokenStore } from "./token-store"

declare module "axios" {
  interface AxiosRequestConfig {
    /**
     * Un 401 de este request es una respuesta esperable, no una sesión vencida:
     * no se refresca ni se redirige. Para el login (credenciales inválidas).
     */
    skipAuthRefresh?: boolean
    /** Interno: el request ya se reintentó una vez tras refrescar. */
    _retriedAfterRefresh?: boolean
  }
}

export interface ApiClientOptions {
  /** URL de la API con el prefijo de versión (`NEXT_PUBLIC_API_URL`). */
  baseURL: string | undefined
  sessionPath?: string
  /**
   * Qué hacer cuando la sesión no se puede recuperar (spec Fase 4, 6: redirect
   * al login ante un 401 no manejado).
   */
  onUnauthenticated: () => void
}

/**
 * Cliente HTTP contra la API: manda el access token y, ante un 401, refresca
 * en silencio y reintenta una vez. Si el refresh tampoco anda, llama a
 * `onUnauthenticated`.
 */
export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const client = axios.create({ baseURL: options.baseURL, timeout: 15_000 })

  client.interceptors.request.use((config) => {
    const token = tokenStore.get()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      const config = error.config
      if (
        error.response?.status !== 401 ||
        !config ||
        config.skipAuthRefresh ||
        typeof window === "undefined"
      ) {
        throw error
      }

      if (!config._retriedAfterRefresh) {
        config._retriedAfterRefresh = true
        const refreshed = await refreshAccessToken(options.sessionPath)
        if (refreshed.status === "ok") {
          config.headers.Authorization = `Bearer ${refreshed.accessToken}`
          return client.request(config)
        }
        // Sin red no se echa a nadie: el request falla y la pantalla muestra
        // el error; el próximo intento vuelve a probar.
        if (refreshed.status === "error") throw error
      }

      tokenStore.clear()
      options.onUnauthenticated()
      throw error
    }
  )

  return client
}

/** Redirige al login recordando dónde estaba el usuario (`?next=`). */
export function redirectToLogin(loginPath: string): void {
  const { pathname, search } = window.location
  if (pathname === loginPath) return
  const next = encodeURIComponent(`${pathname}${search}`)
  window.location.assign(`${loginPath}?next=${next}`)
}

/**
 * El `next` del login, sólo si es una ruta de esta misma app. Un
 * `?next=https://otro-sitio` sería un open redirect.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback: string
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback
  if (next.startsWith("/api/")) return fallback
  return next
}

export { DEFAULT_SESSION_PATH }
