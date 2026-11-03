"use client"

import * as React from "react"
import { toast } from "sonner"

import type {
  ImportEntity,
  ImportResolution,
  ImportRowDto,
  ImportRowStatus,
} from "@adminprop/shared-types"
import { apiErrorMessage } from "@adminprop/session/client"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Checkbox } from "@adminprop/ui/components/checkbox"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Label } from "@adminprop/ui/components/label"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import { LoadMore } from "@/components/load-more"
import {
  ENTITY_LABELS,
  ENTITY_ORDER,
  RESOLUTION_LABELS,
  ROW_STATUS_FILTERS,
  rowLocation,
  rowStatusMeta,
} from "@/lib/migration"
import {
  useInfiniteRows,
  useUpdateRow,
  type RowFilters,
} from "@/lib/migration-api"

const ALL = "ALL"

/** Una fila del lote: errores en línea, conflicto con su resolución y exclusión. */
export function RowCard({
  row,
  defaultResolution,
  editable,
  busy,
  onChange,
}: {
  row: ImportRowDto
  defaultResolution: ImportResolution
  editable: boolean
  busy: boolean
  onChange: (change: {
    excluded?: boolean
    resolution?: ImportResolution
  }) => void
}) {
  const meta = rowStatusMeta(row.status)
  const checkId = React.useId()
  const canExclude = editable && row.status !== "ERROR"

  return (
    <li
      className={
        "flex flex-col gap-2 rounded-xl border bg-card p-3" +
        (row.excluded ? " opacity-60" : "")
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{row.label}</p>
        <Badge variant={meta.badge}>{meta.label}</Badge>
        {row.needsReview && <Badge variant="mantenimiento">A revisar</Badge>}
        {row.excluded && <Badge variant="borrador">Excluida</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">
        {ENTITY_LABELS[row.entity]} · {rowLocation(row)}
      </p>

      {row.errors.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-sm text-destructive">
          {row.errors.map((error, index) => (
            <li key={`${error.field}-${error.code}-${index}`}>
              {error.message}
            </li>
          ))}
        </ul>
      )}

      {row.conflict && (
        <div className="flex flex-col gap-2 rounded-md bg-warning-soft p-2 text-sm">
          <p>
            {row.conflict.reason}
            {row.conflict.differingFields.length > 0 &&
              ` Campos distintos: ${row.conflict.differingFields.join(", ")}.`}
          </p>
          {editable && (
            <Select
              value={row.resolution ?? defaultResolution}
              onValueChange={(value) =>
                onChange({ resolution: value as ImportResolution })
              }
              disabled={busy || row.excluded}
            >
              <SelectTrigger
                aria-label={`Qué hacer con el conflicto de ${row.label}`}
                className="w-full sm:w-56"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RESOLUTION_LABELS) as ImportResolution[]).map(
                  (resolution) => (
                    <SelectItem key={resolution} value={resolution}>
                      {RESOLUTION_LABELS[resolution]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {canExclude && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={checkId}
            checked={row.excluded}
            disabled={busy}
            onCheckedChange={(value) => onChange({ excluded: value === true })}
          />
          <Label htmlFor={checkId} className="text-sm font-normal">
            No importar esta fila
            <span className="sr-only">: {row.label}</span>
          </Label>
        </div>
      )}
    </li>
  )
}

/** Filas del lote con filtros por entidad, estado y "A revisar". */
export function RowsList({
  batchId,
  editable,
  defaultResolution,
  initialFilters,
}: {
  batchId: string
  editable: boolean
  defaultResolution: ImportResolution
  initialFilters?: RowFilters
}) {
  const [filters, setFilters] = React.useState<RowFilters>(initialFilters ?? {})
  const query = useInfiniteRows(batchId, filters)
  const update = useUpdateRow(batchId)
  const reviewId = React.useId()
  const items = query.data?.pages.flatMap((page) => page.data) ?? []

  async function change(
    rowId: string,
    body: { excluded?: boolean; resolution?: ImportResolution }
  ) {
    try {
      await update.mutateAsync({ rowId, ...body })
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo actualizar la fila."))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          value={filters.entity ?? ALL}
          onValueChange={(value) =>
            setFilters((current) => ({
              ...current,
              entity: value === ALL ? undefined : (value as ImportEntity),
            }))
          }
        >
          <SelectTrigger aria-label="Tipo de dato" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los datos</SelectItem>
            {ENTITY_ORDER.map((entity) => (
              <SelectItem key={entity} value={entity}>
                {ENTITY_LABELS[entity]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setFilters((current) => ({
              ...current,
              status: value === ALL ? undefined : (value as ImportRowStatus),
            }))
          }
        >
          <SelectTrigger aria-label="Estado de la fila" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {ROW_STATUS_FILTERS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox
            id={reviewId}
            checked={filters.needsReview === true}
            onCheckedChange={(value) =>
              setFilters((current) => ({
                ...current,
                needsReview: value === true ? true : undefined,
              }))
            }
          />
          <Label htmlFor={reviewId} className="font-normal">
            A revisar
          </Label>
        </div>
      </div>

      {query.isPending ? (
        <PageSkeleton />
      ) : query.isError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {apiErrorMessage(query.error, "No se pudieron cargar las filas.")}
          </AlertDescription>
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin filas"
          description="No hay filas con esos filtros."
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {items.map((row) => (
              <RowCard
                key={row.id}
                row={row}
                defaultResolution={defaultResolution}
                editable={editable}
                busy={update.isPending}
                onChange={(body) => void change(row.id, body)}
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
    </div>
  )
}
