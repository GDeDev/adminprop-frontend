/**
 * Access token en memoria (spec Fase 4, 6): nunca en localStorage, donde lo
 * leería cualquier script inyectado. Se pierde al recargar la página, y por
 * eso la sesión se recupera con el refresh token de la cookie httpOnly.
 */
let accessToken: string | null = null

export const tokenStore = {
  get(): string | null {
    return accessToken
  },
  set(token: string): void {
    accessToken = token
  },
  clear(): void {
    accessToken = null
  },
}
