"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { apiErrorMessage } from "@adminprop/session/client"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import {
  formatDate,
  formatMoney,
  INSTALLMENT_STATUS_META,
  isZero,
  periodLabel,
} from "@/lib/format"
import {
  useOwnerProperties,
  useOwnerPropertyInstallments,
} from "@/lib/portal-api"

/** Historial de pagos del inquilino de cada propiedad (PRD 15.1). */
export function OwnerPaymentsScreen() {
  const searchParams = useSearchParams()
  const properties = useOwnerProperties()
  const [propertyId, setPropertyId] = React.useState<string | null>(
    searchParams.get("propertyId")
  )
  const selected = propertyId ?? properties.data?.[0]?.id ?? null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Pagos
        </h1>
        <p className="text-sm text-muted-foreground">
          Cómo viene pagando el inquilino de cada propiedad, mes a mes.
        </p>
      </div>
      {properties.isPending ? (
        <PageSkeleton cards={2} />
      ) : properties.isError ? (
        <EmptyState
          title="No pudimos cargar tus propiedades"
          description={apiErrorMessage(
            properties.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void properties.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : properties.data.length === 0 ? (
        <EmptyState
          title="Todavía no tenés propiedades cargadas"
          description="La inmobiliaria las carga desde su sistema."
        />
      ) : (
        <>
          <Select value={selected ?? ""} onValueChange={setPropertyId}>
            <SelectTrigger className="w-full sm:w-80" aria-label="Propiedad">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {properties.data.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && <Installments propertyId={selected} />}
        </>
      )}
    </div>
  )
}

function Installments({ propertyId }: { propertyId: string }) {
  const query = useOwnerPropertyInstallments(propertyId)
  const installments = query.data?.pages.flatMap((page) => page.data) ?? []
  if (query.isPending) return <PageSkeleton cards={3} />
  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        {apiErrorMessage(query.error, "No pudimos cargar los pagos.")}
      </p>
    )
  }
  if (installments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay cuotas para esta propiedad.
      </p>
    )
  }
  return (
    <>
      <ul className="flex flex-col gap-2">
        {installments.map((installment) => {
          const meta = INSTALLMENT_STATUS_META[installment.status]
          const money = (amount: string) =>
            formatMoney(amount, installment.currency)
          return (
            <li
              key={installment.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
            >
              <div>
                <p className="font-medium capitalize">
                  {periodLabel(installment.period)}
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {money(installment.baseAmount)}
                  {!isZero(installment.paidTotal) &&
                    ` · pagado ${money(installment.paidTotal)}`}
                  {installment.paidAt &&
                    ` el ${formatDate(installment.paidAt)}`}
                  {installment.status !== "PAID" &&
                    !isZero(installment.totalDue) &&
                    ` · falta ${money(installment.totalDue)}`}
                </p>
              </div>
              <Badge variant={meta.badge}>{meta.label}</Badge>
            </li>
          )
        })}
      </ul>
      {query.hasNextPage && (
        <Button
          variant="outline"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          Ver más
        </Button>
      )}
    </>
  )
}
