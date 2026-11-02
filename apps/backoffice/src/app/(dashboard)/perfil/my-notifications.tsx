"use client"

import * as React from "react"
import { Lock } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  MyNotificationPreferenceItem,
  MyNotificationPreferences,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Switch } from "@adminprop/ui/components/switch"

import {
  useMyNotificationPreferences,
  useUpdateMyNotificationPreferences,
} from "@/lib/notifications-api"

type Channel = "emailEnabled" | "inAppEnabled"

/** Perfil → Mis notificaciones: matriz tipo × (email, en la app). */
export function MyNotifications() {
  const query = useMyNotificationPreferences()
  const update = useUpdateMyNotificationPreferences()
  const [savingType, setSavingType] = React.useState<string | null>(null)

  if (query.isPending) return <PageSkeleton />
  if (query.isError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          {apiErrorMessage(query.error, "No se pudieron cargar tus avisos.")}
        </AlertDescription>
      </Alert>
    )
  }

  const preferences: MyNotificationPreferences = query.data

  async function toggle(
    item: MyNotificationPreferenceItem,
    channel: Channel,
    value: boolean
  ) {
    setSavingType(item.type)
    try {
      await update.mutateAsync({
        items: preferences.items.map((current) => {
          const next =
            current.type === item.type
              ? { ...current, [channel]: value }
              : current
          return {
            type: next.type,
            emailEnabled: next.emailEnabled,
            inAppEnabled: next.inAppEnabled,
          }
        }),
      })
      toast.success("Preferencias guardadas.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo guardar el cambio."))
    } finally {
      setSavingType(null)
    }
  }

  return (
    <section
      aria-labelledby="my-notifications-title"
      className="flex flex-col gap-3"
    >
      <div>
        <h2
          id="my-notifications-title"
          className="font-display text-lg font-semibold"
        >
          Mis notificaciones
        </h2>
        <p className="text-sm text-muted-foreground">
          Elegí qué avisos querés recibir por email y en la campana de la app.
          Los obligatorios no se pueden apagar.
        </p>
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {preferences.items.map((item) => (
          <PreferenceRow
            key={item.type}
            item={item}
            saving={savingType === item.type}
            onToggle={(channel, value) => void toggle(item, channel, value)}
          />
        ))}
      </ul>
    </section>
  )
}

export function PreferenceRow({
  item,
  saving,
  onToggle,
}: {
  item: MyNotificationPreferenceItem
  saving: boolean
  onToggle: (channel: Channel, value: boolean) => void
}) {
  const locked = item.mandatory || saving
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="font-medium">{item.title}</p>
        {item.mandatory && (
          <Badge variant="borrador">
            <Lock aria-hidden />
            Obligatorio
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            aria-label={`${item.title}: email`}
            checked={item.emailEnabled}
            disabled={locked}
            onCheckedChange={(value) => onToggle("emailEnabled", value)}
          />
          Email
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            aria-label={`${item.title}: en la app`}
            checked={item.inAppEnabled}
            disabled={locked}
            onCheckedChange={(value) => onToggle("inAppEnabled", value)}
          />
          En la app
        </label>
      </div>
    </li>
  )
}
