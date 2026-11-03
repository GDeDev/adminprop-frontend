import * as React from "react"
import type { AxiosInstance } from "axios"

import { apiErrorMessage } from "./api-error"
import { useSession } from "./session-provider"

/**
 * Acciones de seguridad de la propia cuenta (`POST /auth/change-password` y
 * `POST /auth/logout-all`). Las dos revocan todos los refresh tokens, incluido
 * el de esta pestaña, así que al salir bien se cierra la sesión local y se
 * lleva al login. Devuelven el mensaje de error o `null` si salió bien.
 */
export function useAccountSecurity(
  apiClient: AxiosInstance,
  loginPath: string
) {
  const { signOut } = useSession()

  const changePassword = React.useCallback(
    async (values: { currentPassword: string; newPassword: string }) => {
      try {
        await apiClient.post("/auth/change-password", values, {
          skipAuthRefresh: true,
        })
      } catch (cause) {
        return apiErrorMessage(cause, "No se pudo cambiar la contraseña.")
      }
      await signOut(loginPath)
      return null
    },
    [apiClient, loginPath, signOut]
  )

  const logoutAll = React.useCallback(async () => {
    try {
      await apiClient.post("/auth/logout-all")
    } catch (cause) {
      return apiErrorMessage(cause, "No se pudieron cerrar las sesiones.")
    }
    await signOut(loginPath)
    return null
  }, [apiClient, loginPath, signOut])

  return { changePassword, logoutAll }
}
