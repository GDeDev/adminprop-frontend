"use client"

import * as React from "react"
import { Eye, Loader2, RefreshCw, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  NotificationChannel,
  NotificationLogItem,
  NotificationStatus,
  NotificationType,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Input } from "@adminprop/ui/components/input"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Progress } from "@adminprop/ui/components/progress"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { LoadMore } from "@/components/load-more"
import { formatDateTime } from "@/lib/automations"
import { isJobFinished, useJobStatus } from "@/lib/jobs-api"
import {
  CHANNEL_LABELS,
  EMAIL_EVENT_LABELS,
  NOTIFICATION_STATUS_FILTERS,
  NOTIFICATION_TYPE_LABELS,
  RECIPIENT_KIND_LABELS,
  SKIP_REASON_LABELS,
  notificationStatusMeta,
  notificationTimeline,
  resendProgressLabel,
  timelineLabel,
} from "@/lib/notifications"
import {
  useInfiniteNotifications,
  useNotification,
  useRefreshNotifications,
  useResendFailed,
  useResendNotification,
  type NotificationFilters,
} from "@/lib/notifications-api"

const ALL = "ALL"

/** Pestaña "Historial": qué salió, a quién, y si llegó. */
export function HistoryTab() {
  const [filters, setFilters] = React.useState<NotificationFilters>({})
  const query = useInfiniteNotifications(filters)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const items = query.data?.pages.flatMap((page) => page.data) ?? []

  function set<K extends keyof NotificationFilters>(
    key: K,
    value: NotificationFilters[K]
  ) {
    setFilters((current) => ({ ...current, [key]: value || undefined }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          value={filters.type ?? ALL}
          onValueChange={(value) =>
            set("type", value === ALL ? undefined : (value as NotificationType))
          }
        >
          <SelectTrigger aria-label="Tipo" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tipos</SelectItem>
            {(Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]).map(
              (type) => (
                <SelectItem key={type} value={type}>
                  {NOTIFICATION_TYPE_LABELS[type]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            set(
              "status",
              value === ALL ? undefined : (value as NotificationStatus)
            )
          }
        >
          <SelectTrigger aria-label="Estado" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {NOTIFICATION_STATUS_FILTERS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.channel ?? ALL}
          onValueChange={(value) =>
            set(
              "channel",
              value === ALL ? undefined : (value as NotificationChannel)
            )
          }
        >
          <SelectTrigger aria-label="Canal" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los canales</SelectItem>
            {(Object.keys(CHANNEL_LABELS) as NotificationChannel[]).map(
              (channel) => (
                <SelectItem key={channel} value={channel}>
                  {CHANNEL_LABELS[channel]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Input
          type="date"
          aria-label="Desde"
          value={filters.from ?? ""}
          onChange={(event) => set("from", event.target.value)}
        />
        <Input
          type="date"
          aria-label="Hasta"
          value={filters.to ?? ""}
          onChange={(event) => set("to", event.target.value)}
        />
      </div>

      <ResendFailedPanel filters={filters} />

      {query.isPending ? (
        <PageSkeleton />
      ) : query.isError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {apiErrorMessage(query.error, "No se pudo cargar el historial.")}
          </AlertDescription>
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin notificaciones"
          description="No hay envíos con esos filtros."
        />
      ) : (
        <>
          {/* Tarjetas en mobile; desde `sm` cada tarjeta se acomoda en fila. */}
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onOpen={() => setOpenId(item.id)}
              />
            ))}
          </ul>
          <LoadMore
            hasMore={query.hasNextPage}
            loading={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}

      <NotificationDetailDialog id={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}

export function NotificationCard({
  item,
  onOpen,
}: {
  item: NotificationLogItem
  onOpen: () => void
}) {
  const meta = notificationStatusMeta(item)
  return (
    <li className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{NOTIFICATION_TYPE_LABELS[item.type]}</p>
          <Badge variant={meta.badge}>{meta.label}</Badge>
        </div>
        <p className="truncate text-sm">
          {item.recipientLabel}
          <span className="text-muted-foreground">
            {" "}
            · {RECIPIENT_KIND_LABELS[item.recipientKind]} ·{" "}
            {CHANNEL_LABELS[item.channel]}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(item.createdAt)}
          {item.attempts > 1 && ` · ${item.attempts} intentos`}
        </p>
        {item.status === "FAILED" && item.lastError && (
          <p className="mt-1 text-xs text-destructive">{item.lastError}</p>
        )}
        {item.status === "SKIPPED" && item.skipReason && (
          <p className="mt-1 text-xs text-muted-foreground">
            {SKIP_REASON_LABELS[item.skipReason]}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="self-start sm:self-center"
        aria-label={`Ver detalle: ${NOTIFICATION_TYPE_LABELS[item.type]} a ${item.recipientLabel}`}
        onClick={onOpen}
      >
        <Eye aria-hidden />
        Detalle
      </Button>
    </li>
  )
}

function NotificationDetailDialog({
  id,
  onClose,
}: {
  id: string | null
  onClose: () => void
}) {
  const detail = useNotification(id)
  const resend = useResendNotification()

  async function resendNow() {
    if (!id) return
    try {
      await resend.mutateAsync(id)
      toast.success("Se volvió a encolar el envío.")
      onClose()
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo reenviar."))
    }
  }

  const data = detail.data
  return (
    <ResponsiveDialog
      open={id !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Detalle del envío</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {data
              ? `${NOTIFICATION_TYPE_LABELS[data.type]} · ${data.recipientLabel}`
              : "Cargando…"}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-4 sm:px-0">
          {detail.isPending ? (
            <Skeleton className="h-32" />
          ) : detail.isError ? (
            <p className="text-sm text-destructive" role="alert">
              {apiErrorMessage(detail.error, "No se pudo cargar el detalle.")}
            </p>
          ) : (
            <div className="flex flex-col gap-4 text-sm">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-muted-foreground">Estado</dt>
                <dd>{notificationStatusMeta(data!).label}</dd>
                <dt className="text-muted-foreground">Canal</dt>
                <dd>{CHANNEL_LABELS[data!.channel]}</dd>
                {data!.recipientEmail && (
                  <>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="break-all">{data!.recipientEmail}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Intentos</dt>
                <dd>{data!.attempts}</dd>
                {data!.nextAttemptAt && (
                  <>
                    <dt className="text-muted-foreground">Próximo intento</dt>
                    <dd>{formatDateTime(data!.nextAttemptAt)}</dd>
                  </>
                )}
                {data!.skipReason && (
                  <>
                    <dt className="text-muted-foreground">Motivo</dt>
                    <dd>{SKIP_REASON_LABELS[data!.skipReason]}</dd>
                  </>
                )}
              </dl>

              {data!.lastError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Último error: {data!.lastError}
                  </AlertDescription>
                </Alert>
              )}

              <section aria-label="Cronología">
                <h3 className="mb-1 font-medium">Cronología</h3>
                <ol className="flex flex-col gap-1 border-l pl-3">
                  {notificationTimeline(data!).map((step) => (
                    <li key={step.label}>{timelineLabel(step)}</li>
                  ))}
                </ol>
                {data!.events.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                    {data!.events.map((event) => (
                      <li key={event.id}>
                        {EMAIL_EVENT_LABELS[event.type]} ·{" "}
                        {formatDateTime(event.occurredAt)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {data!.subject && (
                <section aria-label="Mensaje">
                  <h3 className="mb-1 font-medium">{data!.subject}</h3>
                  {data!.bodyText && (
                    <pre className="max-h-48 overflow-auto rounded-md bg-muted/50 p-3 font-sans whitespace-pre-wrap">
                      {data!.bodyText}
                    </pre>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {data?.canResend && (
            <Button
              onClick={() => void resendNow()}
              disabled={resend.isPending}
            >
              {resend.isPending ? (
                <Loader2 aria-hidden className="animate-spin" />
              ) : (
                <RotateCcw aria-hidden />
              )}
              Reenviar
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

/** "Reintentar todas las fallidas": dispara el AsyncJob y muestra su avance. */
export function ResendFailedPanel({
  filters,
}: {
  filters: NotificationFilters
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [jobId, setJobId] = React.useState<string | null>(null)
  const resendFailed = useResendFailed()
  const status = useJobStatus(jobId)
  const refresh = useRefreshNotifications()
  const notified = React.useRef<string | null>(null)

  const job = status.data
  const finished = job ? isJobFinished(job.status) : false

  React.useEffect(() => {
    if (!jobId || !job || !finished || notified.current === jobId) return
    notified.current = jobId
    void refresh()
    if (job.status === "COMPLETED") {
      toast.success("Terminó el reintento de las notificaciones fallidas.")
    } else if (job.status === "COMPLETED_WITH_ERRORS") {
      toast.warning(`Terminó, pero ${job.failedItems} no se pudieron reenviar.`)
    } else {
      toast.error("El reintento masivo falló.")
    }
  }, [jobId, job, finished, refresh])

  async function start() {
    try {
      const result = await resendFailed.mutateAsync({
        from: filters.from,
        to: filters.to,
        type: filters.type,
      })
      notified.current = null
      setJobId(result.jobId)
      setConfirmOpen(false)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo iniciar el reintento."))
    }
  }

  const running = jobId !== null && !finished

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button
          variant="outline"
          onClick={() => setConfirmOpen(true)}
          disabled={running}
        >
          <RefreshCw aria-hidden />
          Reintentar todas las fallidas
        </Button>
      </div>

      {jobId && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col gap-2 rounded-xl border bg-card p-3"
        >
          {status.isError ? (
            <p className="text-sm text-destructive">
              {apiErrorMessage(
                status.error,
                "No se pudo consultar el avance del reintento."
              )}
            </p>
          ) : !job ? (
            <p className="text-sm text-muted-foreground">Iniciando…</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                {finished
                  ? job.status === "FAILED"
                    ? "El reintento falló"
                    : "Reintento terminado"
                  : "Reintentando notificaciones fallidas…"}
              </p>
              <Progress
                aria-label="Avance del reintento"
                value={job.progress ?? (finished ? 100 : 0)}
              />
              <p className="text-xs text-muted-foreground">
                {resendProgressLabel(
                  job.processedItems,
                  job.totalItems,
                  job.failedItems
                )}
              </p>
            </>
          )}
        </div>
      )}

      <ResponsiveDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              Reintentar todas las fallidas
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Se vuelven a encolar los envíos fallidos
              {filters.type
                ? ` de tipo “${NOTIFICATION_TYPE_LABELS[filters.type]}”`
                : ""}
              {filters.from || filters.to
                ? ` en el período elegido`
                : " de cualquier fecha"}
              . Podés seguir usando el sistema mientras tanto.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={resendFailed.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void start()}
              disabled={resendFailed.isPending}
            >
              Reintentar
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
