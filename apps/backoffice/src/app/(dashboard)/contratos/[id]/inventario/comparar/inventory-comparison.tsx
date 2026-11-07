"use client"

import Link from "next/link"
import { ChevronLeft, Printer } from "lucide-react"

import { toast } from "sonner"

import type {
  InventoryComparison,
  InventoryComparisonRow,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"
import { openInNewTab } from "@adminprop/ui/lib/open-in-new-tab"
import { cn } from "@adminprop/ui/lib/utils"

import { PrivateImage } from "@/components/private-image"
import { formatDate } from "@/lib/dates"
import { CHANGE_LABELS, CONDITION_LABELS } from "@/lib/inventory"
import { useInventoryComparison } from "@/lib/inventory-api"
import { isFileUrlFresh } from "@/lib/private-files"

/** URL (firmada) de una foto dentro de la comparación. */
function photoUrl(data: InventoryComparison | undefined, id: string) {
  return data?.rows
    .flatMap((row) => [...row.deliveryPhotos, ...row.returnPhotos])
    .find((photo) => photo.id === id)?.url
}

/**
 * Las fotos son archivos privados con URL firmada (vence a los 10 minutos):
 * al abrir una, si la URL ya está por vencer se pide la comparación de nuevo,
 * igual que `PrivateFileLink`; la miniatura se recupera sola si falla.
 */
function Photos({
  photos,
  receivedAt,
  refresh,
}: {
  photos: InventoryComparisonRow["deliveryPhotos"]
  receivedAt: number
  refresh: (photoId: string) => Promise<string | undefined>
}) {
  if (photos.length === 0) return null

  async function open(photo: (typeof photos)[number]) {
    try {
      const opened = await openInNewTab(async () =>
        isFileUrlFresh(receivedAt) ? photo.url : await refresh(photo.id)
      )
      if (!opened) toast.error("No se pudo abrir la foto.")
    } catch {
      toast.error("No se pudo abrir la foto.")
    }
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {photos.map((photo) => (
        <button
          key={photo.id}
          type="button"
          aria-label="Abrir foto del inventario"
          className="rounded"
          onClick={() => void open(photo)}
        >
          <PrivateImage
            src={photo.url}
            retryKey={photo.id}
            alt="Foto del inventario"
            className="size-12 rounded object-cover"
            refresh={() => refresh(photo.id)}
          />
        </button>
      ))}
    </div>
  )
}

function ChangeBadge({ change }: { change: InventoryComparisonRow["change"] }) {
  return (
    <Badge
      variant={
        change === "WORSE"
          ? "destructive"
          : change === "BETTER"
            ? "default"
            : "outline"
      }
    >
      {CHANGE_LABELS[change]}
    </Badge>
  )
}

function ConditionCell({
  condition,
  notes,
  photos,
  receivedAt,
  refresh,
}: {
  condition: InventoryComparisonRow["deliveryCondition"]
  notes: string | null
  photos: InventoryComparisonRow["deliveryPhotos"]
  receivedAt: number
  refresh: (photoId: string) => Promise<string | undefined>
}) {
  return (
    <>
      {condition ? CONDITION_LABELS[condition] : "—"}
      {notes && <p className="text-xs text-muted-foreground">{notes}</p>}
      <Photos photos={photos} receivedAt={receivedAt} refresh={refresh} />
    </>
  )
}

/** Entrega y devolución lado a lado, con lo que empeoró resaltado (spec Fase 25, 5.2). */
export function InventoryComparisonScreen({
  contractId,
}: {
  contractId: string
}) {
  const query = useInventoryComparison(contractId)
  if (query.isPending) return <PageSkeleton />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo comparar"
        description="Falta el inventario de entrega o de devolución."
      />
    )
  }
  const {
    rows,
    hasDelivery,
    hasReturn,
    deliveryDate,
    returnDate,
    worsenedCount,
  } = query.data
  const refreshPhoto = async (photoId: string) =>
    photoUrl((await query.refetch()).data, photoId)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="print:hidden">
          <Link href={`/contratos/${contractId}`}>
            <ChevronLeft aria-hidden />
            Contrato
          </Link>
        </Button>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-title-lg font-semibold md:text-display-md">
            Entrega y devolución
          </h1>
          <Button
            variant="outline"
            className="print:hidden"
            onClick={() => window.print()}
          >
            <Printer aria-hidden />
            Imprimir
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Entrega: {hasDelivery ? formatDate(deliveryDate) : "sin inventario"} ·
          Devolución: {hasReturn ? formatDate(returnDate) : "sin inventario"} ·{" "}
          {worsenedCount === 0
            ? "Nada empeoró."
            : `${worsenedCount} ítem${worsenedCount === 1 ? "" : "s"} empeoró`}
        </p>
      </div>

      {!hasDelivery && (
        <Alert>
          <AlertDescription>
            Este contrato no tiene inventario de entrega: no hay punto de
            comparación.
          </AlertDescription>
        </Alert>
      )}

      <ul className="flex flex-col gap-3 lg:hidden" aria-label="Ítems">
        {rows.map((row) => (
          <li
            key={`${row.category}-${row.description}`}
            className={cn(
              "rounded-xl border bg-card p-4 shadow-raised",
              row.change === "WORSE" && "bg-destructive/10"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{row.description}</p>
                <p className="text-xs text-muted-foreground">{row.category}</p>
              </div>
              <ChangeBadge change={row.change} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Entrega</dt>
                <dd>
                  <ConditionCell
                    condition={row.deliveryCondition}
                    notes={row.deliveryNotes}
                    photos={row.deliveryPhotos}
                    receivedAt={query.dataUpdatedAt}
                    refresh={refreshPhoto}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Devolución</dt>
                <dd>
                  <ConditionCell
                    condition={row.returnCondition}
                    notes={row.returnNotes}
                    photos={row.returnPhotos}
                    receivedAt={query.dataUpdatedAt}
                    refresh={refreshPhoto}
                  />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-raised lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ítem</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Devolución</TableHead>
              <TableHead>Cambio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={`${row.category}-${row.description}`}
                className={
                  row.change === "WORSE" ? "bg-destructive/10" : undefined
                }
              >
                <TableCell>
                  <p className="font-medium">{row.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.category}
                  </p>
                </TableCell>
                <TableCell>
                  <ConditionCell
                    condition={row.deliveryCondition}
                    notes={row.deliveryNotes}
                    photos={row.deliveryPhotos}
                    receivedAt={query.dataUpdatedAt}
                    refresh={refreshPhoto}
                  />
                </TableCell>
                <TableCell>
                  <ConditionCell
                    condition={row.returnCondition}
                    notes={row.returnNotes}
                    photos={row.returnPhotos}
                    receivedAt={query.dataUpdatedAt}
                    refresh={refreshPhoto}
                  />
                </TableCell>
                <TableCell>
                  <ChangeBadge change={row.change} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
