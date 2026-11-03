"use client"

import { useAccountSecurity } from "@adminprop/session/client"
import { SecurityPanel } from "@adminprop/ui/components/security-panel"

import { apiClient } from "@/lib/api-client"
import { LOGIN_PATH } from "@/lib/session"

/** "Seguridad" del perfil: cambiar la propia contraseña y cerrar sesiones. */
export function SecuritySection() {
  const { changePassword, logoutAll } = useAccountSecurity(
    apiClient,
    LOGIN_PATH
  )

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold tracking-tight">
        Seguridad
      </h2>
      <SecurityPanel
        onChangePassword={changePassword}
        onLogoutAll={logoutAll}
      />
    </section>
  )
}
