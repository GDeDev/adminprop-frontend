"use client"

import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { IndexStatus } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { formatDateTime, INDEX_FETCH_STATUS_META } from "@/lib/automations"
import { useIndexStatus, useRunJob } from "@/lib/automations-api"
import { formatPeriod } from "@/lib/dates"

/**
 * Fuente y último intento de cada índice (rediseño Fase 13, 2.2 y 6): el
 * job `indices.fetch` los trae del BCRA y del INDEC; "Traer ahora" lo encola.
 */
export function IndexStatusPanel({ canRun }: { canRun: boolean }) {
  const query = useIndexStatus()
  const run = useRunJob()

  async function fetchNow() {
    try {
      await run.mutateAsync({ job: "indices.fetch" })
      toast.success(
        "Buscando los índices en las fuentes oficiales. En unos segundos aparecen acá."
      )
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo encolar la búsqueda."))
    }
  }

  if (query.isPending) return <Skeleton className="h-16" />
  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        {apiErrorMessage(
          query.error,
          "No se pudo cargar el estado de los índices."
        )}
      </p>
    )
  }

  return (
    <section
      className="rounded-xl border bg-card p-4"
      aria-labelledby="index-status-title"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="index-status-title"
          className="font-display text-base font-semibold"
        >
          Actualización automática
        </h2>
        {canRun && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchNow()}
            disabled={run.isPending}
          >
            <RefreshCw aria-hidden />
            Traer ahora
          </Button>
        )}
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {query.data.map((status) => (
          <StatusRow key={status.indexType} status={status} />
        ))}
      </ul>
    </section>
  )
}

function StatusRow({ status }: { status: IndexStatus }) {
  const meta = status.lastAttemptStatus
    ? INDEX_FETCH_STATUS_META[status.lastAttemptStatus]
    : null
  return (
    <li className="flex flex-wrap items-center gap-2">
      <span className="w-10 font-medium">{status.indexType}</span>
      <span className="text-muted-foreground">
        {status.latestPeriod
          ? `último mes cargado: ${formatPeriod(status.latestPeriod)}${status.source ? ` (${status.source})` : ""}`
          : "sin valores cargados"}
        {status.provider === "manual" && " · carga manual"}
        {status.lastAttemptAt &&
          ` · último intento: ${formatDateTime(status.lastAttemptAt)}`}
      </span>
      {meta && <Badge variant={meta.badge}>{meta.label}</Badge>}
      {status.lastAttemptError && (
        <span className="text-xs text-destructive">
          {status.lastAttemptError}
        </span>
      )}
    </li>
  )
}
