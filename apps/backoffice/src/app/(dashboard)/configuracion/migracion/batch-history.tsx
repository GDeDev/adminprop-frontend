"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import type { ImportBatchStatus, ImportSource } from "@adminprop/shared-types"
import { apiErrorMessage } from "@adminprop/session/client"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import { LoadMore } from "@/components/load-more"
import { formatDateTime } from "@/lib/automations"
import {
  BATCH_STATUS_FILTERS,
  SOURCE_LABELS,
  batchStatusMeta,
} from "@/lib/migration"
import { useInfiniteBatches, type BatchFilters } from "@/lib/migration-api"

import { batchPath } from "./paths"

const ALL = "ALL"

/** Historial de lotes: cada uno se puede reabrir para revisar o ver el resultado. */
export function BatchHistory() {
  const [filters, setFilters] = React.useState<BatchFilters>({})
  const query = useInfiniteBatches(filters)
  const items = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="history-title" className="font-medium">
          Historial de lotes
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.source ?? ALL}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                source: value === ALL ? undefined : (value as ImportSource),
              }))
            }
          >
            <SelectTrigger aria-label="Origen" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los orígenes</SelectItem>
              {(Object.keys(SOURCE_LABELS) as ImportSource[]).map((source) => (
                <SelectItem key={source} value={source}>
                  {SOURCE_LABELS[source]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status ?? ALL}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                status:
                  value === ALL ? undefined : (value as ImportBatchStatus),
              }))
            }
          >
            <SelectTrigger aria-label="Estado" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {BATCH_STATUS_FILTERS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
          title="Todavía no hay migraciones"
          description="Cuando analices un Excel o Tokko, el lote aparece acá."
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {items.map((batch) => {
              const meta = batchStatusMeta(batch.status)
              return (
                <li key={batch.id}>
                  <Link
                    href={batchPath(batch.id)}
                    className="flex lift items-center gap-3 rounded-xl border bg-card p-3 shadow-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          {SOURCE_LABELS[batch.source]}
                          {batch.fileName && (
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              · {batch.fileName}
                            </span>
                          )}
                        </p>
                        <Badge variant={meta.badge}>{meta.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(batch.createdAt)} ·{" "}
                        {batch.createdBy.fullName}
                      </p>
                      <p className="text-sm">
                        {batch.counts.total} filas · {batch.counts.valid} listas
                        · {batch.counts.errors} con errores ·{" "}
                        {batch.counts.imported} importadas
                      </p>
                    </div>
                    <ChevronRight
                      aria-hidden
                      className="size-4 text-muted-foreground"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
          <LoadMore
            hasMore={query.hasNextPage}
            loading={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}
    </section>
  )
}
