"use client"

import * as React from "react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorCode } from "@adminprop/session/client"
import type {
  ListingChannelDto,
  PropertyListingDto,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { conversionLabel, crmApiError, STAGE_LABELS, STAGES } from "@/lib/crm"
import { usePropertyAnalytics } from "@/lib/crm-api"
import { addDays, todayIso } from "@/lib/dates"
import { formatDateTime } from "@/lib/automations"
import { isJobFinished, useJobStatus } from "@/lib/jobs-api"
import {
  CHANNEL_LABELS,
  LISTING_ACTION_LABELS,
  listingActions,
  listingStatusMeta,
  missingFromError,
} from "@/lib/listings"
import type { ListingAction } from "@/lib/listings"
import {
  listingsKey,
  startsJob,
  useChannels,
  useListingAction,
  usePropertyListings,
} from "@/lib/listings-api"

/** Ficha de propiedad → Publicación y analíticas (rediseño Fase 23, sección 8). */
export function PublicationSection({ propertyId }: { propertyId: string }) {
  const listings = usePropertyListings(propertyId)
  const channels = useChannels()

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="publication-title"
        className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised"
      >
        <h2
          id="publication-title"
          className="font-display text-lg font-semibold"
        >
          Publicación
        </h2>
        {listings.isPending && <Skeleton className="h-24" />}
        {listings.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {crmApiError(
                listings.error,
                "No se pudieron cargar las publicaciones."
              )}
            </AlertDescription>
          </Alert>
        )}
        <ul className="grid gap-3 md:grid-cols-3">
          {listings.data?.map((listing) => (
            <li key={listing.channel}>
              <ListingCard
                propertyId={propertyId}
                listing={listing}
                channel={channels.data?.find(
                  (item) => item.channel === listing.channel
                )}
              />
            </li>
          ))}
        </ul>
      </section>
      <Analytics propertyId={propertyId} />
    </div>
  )
}

function ListingCard({
  propertyId,
  listing,
  channel,
}: {
  propertyId: string
  listing: PropertyListingDto
  channel: ListingChannelDto | undefined
}) {
  const queryClient = useQueryClient()
  const action = useListingAction(propertyId)
  const [jobId, setJobId] = React.useState<string | null>(null)
  const [missing, setMissing] = React.useState<string[]>([])
  const job = useJobStatus(jobId)
  const unavailable = channel?.status === "UNAVAILABLE"
  const notConnected = channel?.status === "DISCONNECTED"
  const meta = listingStatusMeta(listing.status)
  const handled = React.useRef<string | null>(null)
  const finished = job.data ? isJobFinished(job.data.status) : false

  React.useEffect(() => {
    if (!jobId || !finished || handled.current === jobId) return
    handled.current = jobId
    void queryClient.invalidateQueries({ queryKey: listingsKey })
    if (job.data?.status === "FAILED") {
      toast.error("La publicación falló. Revisá el detalle e intentá de nuevo.")
    } else {
      toast.success("Publicación actualizada.")
    }
  }, [jobId, finished, job.data?.status, queryClient])

  async function run(kind: ListingAction) {
    setMissing([])
    try {
      const result = await action.mutateAsync({
        channel: listing.channel,
        action: kind,
      })
      if (startsJob(result)) setJobId(result.jobId)
      else toast.success("Listo.")
    } catch (error) {
      if (apiErrorCode(error) === "LISTING_NOT_READY") {
        setMissing(missingFromError(error))
      }
      toast.error(crmApiError(error, "No se pudo completar la acción."))
    }
  }

  const running = jobId !== null && !finished
  const busy = action.isPending || running
  const actions = unavailable || notConnected ? [] : listingActions(listing)
  const missingList = missing.length > 0 ? missing : listing.missingForPublish

  return (
    <div
      className={`flex h-full flex-col gap-2 rounded-lg border p-3 text-sm ${unavailable ? "border-dashed text-muted-foreground" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{CHANNEL_LABELS[listing.channel]}</h3>
        <Badge variant={unavailable ? "borrador" : meta.badge}>
          {unavailable ? "No disponible" : meta.label}
        </Badge>
      </div>

      {unavailable && (
        <p>{channel?.unavailableReason ?? "Requiere un acuerdo comercial."}</p>
      )}
      {notConnected && (
        <p>
          El canal no está conectado.{" "}
          <Link href="/configuracion/canales" className="underline">
            Conectarlo
          </Link>
        </p>
      )}
      {listing.externalUrl && (
        <a
          href={listing.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary underline"
        >
          Ver publicación
          <ExternalLink aria-hidden className="size-3" />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </a>
      )}
      {listing.publishedAt && (
        <p className="text-xs text-muted-foreground">
          Publicada el {formatDateTime(listing.publishedAt)}
        </p>
      )}
      {listing.hasUnpublishedChanges && (
        <p className="font-medium text-amber-700 dark:text-amber-400">
          Hay cambios sin publicar.
        </p>
      )}
      {listing.status === "ERROR" && listing.lastError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{listing.lastError}</AlertDescription>
        </Alert>
      )}
      {!unavailable &&
        !notConnected &&
        !listing.canPublish &&
        (listing.status === "NOT_PUBLISHED" || listing.status === "CLOSED") && (
          <div>
            <p>Para publicar falta:</p>
            <ul className="list-disc pl-5">
              {missingList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      {(listing.status === "PUBLISHING" || running) && (
        <p className="flex items-center gap-2" role="status">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Publicando…
          {job.data?.totalItems
            ? ` ${job.data.processedItems} de ${job.data.totalItems}`
            : ""}
        </p>
      )}

      {actions.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {actions.map((kind, index) => (
            <Button
              key={kind}
              size="sm"
              variant={index === 0 ? "default" : "outline"}
              disabled={busy}
              onClick={() => void run(kind)}
            >
              {LISTING_ACTION_LABELS[kind]}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

const RANGE_DAYS = 30

/** Vistas, consultas y conversión de la propiedad en los últimos 30 días. */
function Analytics({ propertyId }: { propertyId: string }) {
  const range = React.useMemo(() => {
    const to = todayIso()
    return { from: addDays(to, -RANGE_DAYS), to }
  }, [])
  const analytics = usePropertyAnalytics(propertyId, range)

  return (
    <section
      aria-labelledby="analytics-title"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised"
    >
      <h2 id="analytics-title" className="font-display text-lg font-semibold">
        Interés en la propiedad
      </h2>
      {analytics.isPending && <Skeleton className="h-20" />}
      {analytics.isError && (
        <p className="text-sm text-muted-foreground">
          No se pudieron cargar las analíticas.
        </p>
      )}
      {analytics.data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Figure label="Vistas" value={String(analytics.data.views)} />
            <Figure
              label="Consultas"
              value={String(analytics.data.inquiries)}
            />
            <Figure
              label="Conversión"
              value={conversionLabel(analytics.data.conversionRate)}
            />
          </div>
          <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {STAGES.map((stage) => (
              <li key={stage}>
                {STAGE_LABELS[stage]}: {analytics.data.byStage[stage] ?? 0}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Últimos {RANGE_DAYS} días. Las vistas se cuentan desde que se activó
            esta función; antes no hay datos.
          </p>
        </>
      )}
    </section>
  )
}
