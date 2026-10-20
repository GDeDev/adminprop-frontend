import type { AuthTokens } from "@adminprop/shared-types"

import { tokenStore } from "./token-store"

/** Donde cada app monta los route handlers de `@adminprop/session/server`. */
export const DEFAULT_SESSION_PATH = "/api/session"

export type RefreshResult =
  | { status: "ok"; accessToken: string }
  /** No hay sesión o la API la rechazó: hay que volver a loguearse. */
  | { status: "unauthenticated" }
  /** No se pudo preguntar (red, API caída): la sesión puede seguir viva. */
  | { status: "error" }

let inflight: Promise<RefreshResult> | null = null

/**
 * Pide un access token nuevo con el refresh token de la cookie.
 *
 * Dos cuidados, porque la API trata el reuso de un refresh token como robo y
 * cierra todas las sesiones:
 *
 * - **Una sola vez por pestaña**: si varios requests fallan con 401 a la vez,
 *   todos esperan el mismo refresh.
 * - **Uno a la vez entre pestañas** (Web Locks): la cookie es compartida. Si
 *   dos pestañas refrescaran en paralelo, la segunda mandaría un token que la
 *   primera acaba de rotar. Con el lock, la segunda espera y usa la cookie
 *   nueva.
 */
export function refreshAccessToken(
  basePath: string = DEFAULT_SESSION_PATH
): Promise<RefreshResult> {
  inflight ??= withCrossTabLock(`adminprop-session:${basePath}`, () =>
    requestRefresh(basePath)
  ).finally(() => {
    inflight = null
  })
  return inflight
}

async function requestRefresh(basePath: string): Promise<RefreshResult> {
  let response: Response
  try {
    response = await fetch(`${basePath}/refresh`, {
      method: "POST",
      credentials: "same-origin",
    })
  } catch {
    return { status: "error" }
  }

  if (response.status === 401 || response.status === 403) {
    tokenStore.clear()
    return { status: "unauthenticated" }
  }
  if (!response.ok) return { status: "error" }

  const { accessToken } = (await response.json()) as { accessToken: string }
  tokenStore.set(accessToken)
  return { status: "ok", accessToken }
}

async function withCrossTabLock<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks
  // Navegadores sin Web Locks (muy viejos): queda sólo el single-flight.
  if (!locks) return fn()
  return locks.request(name, fn)
}

/** Guarda el refresh token del login en la cookie httpOnly (vía la app). */
export async function startSession(
  tokens: Pick<AuthTokens, "accessToken" | "refreshToken">,
  basePath: string = DEFAULT_SESSION_PATH
): Promise<void> {
  const response = await fetch(basePath, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }),
  })
  if (!response.ok) {
    throw new Error("No se pudo guardar la sesión")
  }
  tokenStore.set(tokens.accessToken)
}

/** Revoca la sesión en la API y borra la cookie. Nunca falla: salir es salir. */
export async function endSession(
  basePath: string = DEFAULT_SESSION_PATH
): Promise<void> {
  tokenStore.clear()
  try {
    await fetch(basePath, { method: "DELETE", credentials: "same-origin" })
  } catch {
    // Sin red la cookie queda, pero el access token ya no está en memoria y
    // el refresh token vence solo.
  }
}
