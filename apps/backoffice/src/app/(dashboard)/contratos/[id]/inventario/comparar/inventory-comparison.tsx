"use client"

import Link from "next/link"
import { ChevronLeft, Printer } from "lucide-react"

import type { InventoryComparisonRow } from "@adminprop/shared-types"
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

import { formatDate } from "@/lib/dates"
import { CHANGE_LABELS, CONDITION_LABELS } from "@/lib/inventory"
import { useInventoryComparison } from "@/lib/inventory-api"

function Photos({
  photos,
}: {
  photos: InventoryComparisonRow["deliveryPhotos"]
}) {
  if (photos.length === 0) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {photos.map((photo) => (
        <a
          key={photo.id}
          href={photo.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt="Foto del inventario"
            className="size-12 rounded object-cover"
          />
        </a>
      ))}
    </div>
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
          <h1 className="font-display text-2xl font-semibold tracking-tight">
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

      <div className="overflow-x-auto rounded-xl border bg-card shadow-raised">
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
                  {row.deliveryCondition
                    ? CONDITION_LABELS[row.deliveryCondition]
                    : "—"}
                  {row.deliveryNotes && (
                    <p className="text-xs text-muted-foreground">
                      {row.deliveryNotes}
                    </p>
                  )}
                  <Photos photos={row.deliveryPhotos} />
                </TableCell>
                <TableCell>
                  {row.returnCondition
                    ? CONDITION_LABELS[row.returnCondition]
                    : "—"}
                  {row.returnNotes && (
                    <p className="text-xs text-muted-foreground">
                      {row.returnNotes}
                    </p>
                  )}
                  <Photos photos={row.returnPhotos} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row.change === "WORSE"
                        ? "destructive"
                        : row.change === "BETTER"
                          ? "default"
                          : "outline"
                    }
                  >
                    {CHANGE_LABELS[row.change]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
