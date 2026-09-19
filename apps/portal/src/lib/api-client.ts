import { createApiClient, redirectToLogin } from "@adminprop/session/client"

import { areaForPath, PORTAL_AREAS } from "./session"

/**
 * Cliente HTTP contra la API (mismo contrato que el del backoffice). Si la
 * sesión no se puede recuperar, manda al login del área en la que está el
 * usuario; en las páginas públicas no redirige.
 */
export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  onUnauthenticated: () => {
    const area = areaForPath(window.location.pathname)
    if (area) redirectToLogin(PORTAL_AREAS[area].loginPath)
  },
})
