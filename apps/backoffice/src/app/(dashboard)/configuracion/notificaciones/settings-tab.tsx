"use client"

import * as React from "react"
import { Lock } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  NotificationChannel,
  NotificationTypeSetting,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Switch } from "@adminprop/ui/components/switch"

import { CHANNEL_LABELS, toggleChannel } from "@/lib/notifications"
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/lib/notifications-api"

/** Pestaña "Eventos y canales": interruptor por tipo y chips de canal. */
export function SettingsTab() {
  const query = useNotificationSettings()
  const update = useUpdateNotificationSettings()
  const [savingType, setSavingType] = React.useState<string | null>(null)

  if (query.isPending) return <PageSkeleton />
  if (query.isError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          {apiErrorMessage(query.error, "No se pudo cargar la configuración.")}
        </AlertDescription>
      </Alert>
    )
  }

  const settings = query.data

  async function save(
    changed: NotificationTypeSetting,
    patch: Partial<Pick<NotificationTypeSetting, "enabled" | "channels">>
  ) {
    setSavingType(changed.type)
    try {
      // Se manda la lista completa con el cambio aplicado.
      await update.mutateAsync({
        settings: settings.map((setting) => {
          const next =
            setting.type === changed.type ? { ...setting, ...patch } : setting
          return {
            type: next.type,
            enabled: next.enabled,
            channels: next.channels,
          }
        }),
      })
      toast.success("Configuración guardada.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo guardar el cambio."))
    } finally {
      setSavingType(null)
    }
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {settings.map((setting) => (
        <SettingRow
          key={setting.type}
          setting={setting}
          saving={savingType === setting.type}
          onChange={(patch) => void save(setting, patch)}
        />
      ))}
    </ul>
  )
}

export function SettingRow({
  setting,
  saving,
  onChange,
}: {
  setting: NotificationTypeSetting
  saving: boolean
  onChange: (
    patch: Partial<Pick<NotificationTypeSetting, "enabled" | "channels">>
  ) => void
}) {
  const titleId = `setting-${setting.type}`

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p id={titleId} className="font-medium">
            {setting.title}
          </p>
          <Badge variant="outline">{setting.audience}</Badge>
          {setting.mandatory && (
            <Badge variant="borrador">
              <Lock aria-hidden />
              Obligatorio
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {setting.description}
        </p>
        <div
          role="group"
          aria-label={`Canales de ${setting.title}`}
          className="mt-2 flex flex-wrap gap-2"
        >
          {setting.availableChannels.map((channel: NotificationChannel) => {
            const active = setting.channels.includes(channel)
            return (
              <button
                key={channel}
                type="button"
                aria-pressed={active}
                disabled={saving || setting.mandatory || !setting.enabled}
                onClick={() =>
                  onChange({
                    channels: toggleChannel(
                      setting.channels,
                      setting.availableChannels,
                      channel
                    ),
                  })
                }
                className={
                  "inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 " +
                  (active
                    ? "border-transparent bg-info-soft text-info"
                    : "bg-card text-muted-foreground hover:bg-muted")
                }
              >
                {CHANNEL_LABELS[channel]}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:pt-1">
        <Switch
          aria-labelledby={titleId}
          checked={setting.enabled}
          disabled={saving || setting.mandatory}
          onCheckedChange={(enabled) => onChange({ enabled })}
        />
        <span className="w-16 text-sm text-muted-foreground" aria-hidden>
          {setting.enabled ? "Activo" : "Apagado"}
        </span>
      </div>
    </li>
  )
}
