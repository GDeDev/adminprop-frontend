"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ClipboardCheck, GitCompare } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { InventorySummary, InventoryType } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { formatDate } from "@/lib/dates"
import {
  INVENTORY_STATUS_META,
  INVENTORY_TYPE_LABELS,
  inventoryCardState,
} from "@/lib/inventory"
import { useContractInventories, useCreateInventory } from "@/lib/inventory-api"

/**
 * Sección "Inventario" de la ficha de contrato (spec Fase 25, 5.1): una
 * tarjeta para la entrega y otra para la devolución, y la comparación cuando
 * existen las dos.
 */
export function InventorySection({ contractId }: { contractId: string }) {
  const query = useContractInventories(contractId)
  const create = useCreateInventory()
  const router = useRouter()

  if (query.isPending) return <Skeleton className="h-24" />
  if (query.isError) {
    return (
      <p className="text-sm text-muted-foreground">
        No se pudo cargar el inventario.
      </p>
    )
  }
  const { inventories, canCreateDelivery, canCreateReturn } = query.data
  const byType = (type: InventoryType) =>
    inventories.find((inventory) => inventory.type === type)
  const delivery = byType("DELIVERY")
  const returned = byType("RETURN")

  async function start(type: InventoryType) {
    try {
      const created = await create.mutateAsync({ contractId, type })
      router.push(`/contratos/${contractId}/inventario/${created.id}`)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo iniciar el inventario."))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <InventoryCard
          type="DELIVERY"
          summary={delivery}
          contractId={contractId}
          canStart={canCreateDelivery}
          busy={create.isPending}
          onStart={() => void start("DELIVERY")}
        />
        <InventoryCard
          type="RETURN"
          summary={returned}
          contractId={contractId}
          canStart={canCreateReturn}
          busy={create.isPending}
          onStart={() => void start("RETURN")}
          hint={
            !returned && !canCreateReturn
              ? "Se habilita al iniciar la rescisión o cerca del fin del contrato."
              : undefined
          }
        />
      </div>
      {(delivery || returned) && (
        <div>
          <Button variant="outline" asChild>
            <Link href={`/contratos/${contractId}/inventario/comparar`}>
              <GitCompare aria-hidden />
              Comparar entrega y devolución
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function InventoryCard({
  type,
  summary,
  contractId,
  canStart,
  busy,
  onStart,
  hint,
}: {
  type: InventoryType
  summary: InventorySummary | undefined
  contractId: string
  canStart: boolean
  busy: boolean
  onStart: () => void
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{INVENTORY_TYPE_LABELS[type]}</p>
        {summary ? (
          <Badge variant={INVENTORY_STATUS_META[summary.status].variant}>
            {inventoryCardState(summary)}
          </Badge>
        ) : (
          <Badge variant="outline">{inventoryCardState(summary)}</Badge>
        )}
      </div>
      {summary ? (
        <>
          <p className="text-sm text-muted-foreground">
            {formatDate(summary.date)} · {summary.itemCount} ítems ·{" "}
            {summary.photoCount} fotos
            {summary.poorCount > 0 && ` · ${summary.poorCount} en mal estado`}
            {summary.tenantAcknowledged && " · conforme el inquilino"}
          </p>
          <Button variant="outline" size="sm" asChild className="self-start">
            <Link href={`/contratos/${contractId}/inventario/${summary.id}`}>
              {summary.status === "DRAFT" ? "Continuar" : "Ver"}
            </Link>
          </Button>
        </>
      ) : (
        <>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
          {canStart && (
            <Button
              size="sm"
              className="self-start"
              onClick={onStart}
              disabled={busy}
            >
              <ClipboardCheck aria-hidden />
              Realizar inventario
            </Button>
          )}
        </>
      )}
    </div>
  )
}
