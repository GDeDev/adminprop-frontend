"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Link2, Loader2, Unlink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { useSession } from "@adminprop/session/client"
import type { ListingChannelDto } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { formatDateTime } from "@/lib/automations"
import { crmApiError } from "@/lib/crm"
import { CHANNEL_LABELS, channelStatusMeta } from "@/lib/listings"
import {
  useChannels,
  useConnectMercadoLibre,
  useDisconnectChannel,
} from "@/lib/listings-api"

/** Configuración → Canales de publicación (rediseño Fase 23, sección 8). */
export function ChannelsScreen() {
  const { user } = useSession()
  const channels = useChannels()
  const params = useSearchParams()
  const connected = params.get("connected")

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        title="Sólo para administradores"
        description="Los canales de publicación los gestiona un administrador."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/configuracion"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Configuración
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Canales de publicación
        </h1>
        <p className="text-sm text-muted-foreground">
          Conectá las cuentas donde publicás tus propiedades. Las consultas que
          lleguen se cargan solas en el embudo.
        </p>
      </div>

      {connected === "mercadolibre" &&
        channels.data?.some(
          (item) =>
            item.channel === "MERCADOLIBRE" && item.status === "CONNECTED"
        ) && (
          <Alert role="status">
            <AlertDescription>Mercado Libre quedó conectado.</AlertDescription>
          </Alert>
        )}
      {channels.isPending && <Skeleton className="h-40" />}
      {channels.isError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {crmApiError(channels.error, "No se pudieron cargar los canales.")}{" "}
            <Button variant="link" onClick={() => void channels.refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {channels.data && (
        <ul className="grid gap-3 md:grid-cols-2">
          {channels.data?.map((channel) => (
            <li key={channel.channel}>
              <ChannelCard channel={channel} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ChannelCard({ channel }: { channel: ListingChannelDto }) {
  const meta = channelStatusMeta(channel.status)
  const unavailable = channel.status === "UNAVAILABLE"
  const titleId = `channel-${channel.channel}`

  return (
    <section
      aria-labelledby={titleId}
      aria-disabled={unavailable || undefined}
      className={`flex h-full flex-col gap-3 rounded-xl border bg-card p-4 ${unavailable ? "border-dashed text-muted-foreground" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={titleId} className="font-medium">
          {CHANNEL_LABELS[channel.channel]}
        </h2>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </div>

      {unavailable && (
        <p className="text-sm">
          {channel.unavailableReason ??
            "Requiere un acuerdo comercial con el portal."}
        </p>
      )}
      {channel.accountLabel && (
        <p className="text-sm">
          Cuenta: <span className="font-medium">{channel.accountLabel}</span>
        </p>
      )}
      {channel.connectedAt && (
        <p className="text-xs text-muted-foreground">
          Conectado el {formatDateTime(channel.connectedAt)}
        </p>
      )}
      {channel.status === "ERROR" && channel.lastError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            La conexión con el portal falló: {channel.lastError} Reconectá la
            cuenta para seguir publicando.
          </AlertDescription>
        </Alert>
      )}

      {channel.channel === "MERCADOLIBRE" && !unavailable && (
        <MercadoLibreActions channel={channel} />
      )}
    </section>
  )
}

function MercadoLibreActions({ channel }: { channel: ListingChannelDto }) {
  const router = useRouter()
  const connect = useConnectMercadoLibre()
  const [confirming, setConfirming] = React.useState(false)
  const isConnected = channel.status !== "DISCONNECTED"

  async function start() {
    try {
      const { authorizeUrl } = await connect.mutateAsync()
      window.location.assign(authorizeUrl)
    } catch (error) {
      toast.error(crmApiError(error, "No se pudo iniciar la conexión."))
    }
  }

  return (
    <div className="mt-auto flex flex-wrap gap-2">
      <Button
        onClick={() => void start()}
        disabled={connect.isPending}
        variant={isConnected ? "outline" : "default"}
      >
        {connect.isPending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <Link2 aria-hidden />
        )}
        {isConnected ? "Reconectar" : "Conectar"}
      </Button>
      {isConnected && (
        <Button variant="outline" onClick={() => setConfirming(true)}>
          <Unlink aria-hidden />
          Desconectar
        </Button>
      )}
      <DisconnectDialog
        open={confirming}
        onOpenChange={setConfirming}
        onDone={() => router.refresh()}
      />
    </div>
  )
}

function DisconnectDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const disconnect = useDisconnectChannel()

  async function confirm() {
    try {
      await disconnect.mutateAsync("MERCADOLIBRE")
      toast.success("Mercado Libre desconectado.")
      onOpenChange(false)
      onDone()
    } catch (error) {
      toast.error(crmApiError(error, "No se pudo desconectar el canal."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Desconectar Mercado Libre
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Las publicaciones activas siguen en Mercado Libre: AdminProp deja de
            poder pausarlas, cerrarlas o traer sus consultas. Para volver a
            gestionarlas, reconectá la cuenta.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={disconnect.isPending}
            onClick={() => void confirm()}
          >
            {disconnect.isPending && (
              <Loader2 aria-hidden className="animate-spin" />
            )}
            Desconectar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
