"use client"

import { useAccountSecurity } from "@adminprop/session/client"
import { SecurityPanel } from "@adminprop/ui/components/security-panel"

import { apiClient } from "@/lib/api-client"
import { PORTAL_AREAS } from "@/lib/session"
import type { PortalRole } from "@adminprop/shared-types"

/** Seguridad de la cuenta del portal: cambiar contraseña y cerrar sesiones. */
export function PortalSecurityScreen({ role }: { role: PortalRole }) {
  const { changePassword, logoutAll } = useAccountSecurity(
    apiClient,
    PORTAL_AREAS[role].loginPath
  )

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Seguridad
      </h1>
      <SecurityPanel
        onChangePassword={changePassword}
        onLogoutAll={logoutAll}
      />
    </div>
  )
}
