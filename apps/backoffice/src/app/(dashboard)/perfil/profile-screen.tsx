"use client"

import { useSession } from "@adminprop/session/client"

import { displayName, roleLabel } from "@/lib/users"

import { MyNotifications } from "./my-notifications"

/** Perfil del usuario logueado. Por ahora: datos básicos y "Mis notificaciones". */
export function ProfileScreen() {
  const { user } = useSession()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Mi perfil
        </h1>
        {user && (
          <p className="text-sm text-muted-foreground">
            {displayName(user)} · {user.email} · {roleLabel(user.role)}
          </p>
        )}
      </div>
      <MyNotifications />
    </div>
  )
}
