/**
 * Access token en memoria (Fase 4, sección 6: nunca en localStorage).
 * El refresh token va en cookie httpOnly que setea la API.
 *
 * Placeholder: hasta que exista /auth/login nadie llama a setAccessToken.
 */
let accessToken: string | null = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}
