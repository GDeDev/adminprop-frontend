"use client"

import Link from "next/link"
import { Bell, Check } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { InternalAlert } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { LoadMore } from "@/components/load-more"
import { ALERT_TYPE_LABELS, relativeTime } from "@/lib/automations"
import {
  useInfiniteAlerts,
  useMarkAlertRead,
  useMarkAllAlertsRead,
} from "@/lib/automations-api"

/**
 * Avisos internos de las automatizaciones (rediseño Fase 13, sección 6):
 * aumentos pendientes, índices que no se pudieron traer, cuotas con base
 * vieja, consolidados sin cerrar. Se marcan leídos; el dashboard real llega
 * en la Fase 19 y absorbe esta tarjeta.
 */
export function InternalAlerts() {
  const query = useInfiniteAlerts(true)
  const markRead = useMarkAlertRead()
  const markAll = useMarkAllAlertsRead()
  const alerts = query.data?.pages.flatMap((page) => page.data) ?? []
  const total = query.data?.pages[0]?.pagination.total ?? alerts.length

  async function read(alert: InternalAlert) {
    try {
      await markRead.mutateAsync(alert.id)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo marcar el aviso."))
    }
  }

  async function readAll() {
    try {
      await markAll.mutateAsync()
      toast.success("Avisos marcados como leídos.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudieron marcar los avisos."))
    }
  }

  return (
    <section
      className="rounded-xl border bg-card p-4"
      aria-labelledby="internal-alerts-title"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="internal-alerts-title"
          className="flex items-center gap-2 font-display text-lg font-semibold"
        >
          <Bell aria-hidden className="size-5 text-primary" />
          Avisos
          {query.isSuccess && total > 0 && (
            <Badge variant="mantenimiento" className="tabular-nums">
              {total}
            </Badge>
          )}
        </h2>
        {alerts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void readAll()}
            disabled={markAll.isPending}
          >
            <Check aria-hidden />
            Marcar todos leídos
          </Button>
        )}
      </div>
      {query.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(query.error, "No se pudieron cargar los avisos.")}
        </p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin avisos pendientes.</p>
      ) : (
        <>
          <ul className="flex flex-col divide-y text-sm">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-wrap items-start justify-between gap-2 py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {alert.link ? (
                      <Link href={alert.link} className="hover:underline">
                        {alert.title}
                      </Link>
                    ) : (
                      alert.title
                    )}
                  </p>
                  <p className="text-muted-foreground">{alert.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {ALERT_TYPE_LABELS[alert.type]} ·{" "}
                    {relativeTime(alert.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Marcar leído: ${alert.title}`}
                  onClick={() => void read(alert)}
                  disabled={markRead.isPending}
                >
                  <Check aria-hidden />
                  Leído
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <LoadMore
              hasMore={query.hasNextPage}
              loading={query.isFetchingNextPage}
              onLoadMore={() => void query.fetchNextPage()}
            />
          </div>
        </>
      )}
    </section>
  )
}
