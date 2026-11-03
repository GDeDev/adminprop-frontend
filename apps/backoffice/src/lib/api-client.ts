import { createApiClient, redirectToLogin } from "@adminprop/session/client"

import { LOGIN_PATH } from "./session"

/**
 * Cliente HTTP contra la API (adminprop-backend). Manda el access token y
 * refresca la sesión en silencio; si no se puede, lleva al login.
 *
 * Todas las pantallas usan la API real.
 */
export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  onUnauthenticated: () => redirectToLogin(LOGIN_PATH),
})
