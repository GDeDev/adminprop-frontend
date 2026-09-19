import { createApiClient, redirectToLogin } from "@adminprop/session/client"

import { LOGIN_PATH } from "./session"

/**
 * Cliente HTTP contra la API (adminprop-backend). Manda el access token y
 * refresca la sesión en silencio; si no se puede, lleva al login.
 *
 * Las pantallas que todavía no tienen endpoint siguen usando @adminprop/mocks.
 */
export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  onUnauthenticated: () => redirectToLogin(LOGIN_PATH),
})
