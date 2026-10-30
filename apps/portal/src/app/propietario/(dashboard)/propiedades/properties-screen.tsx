"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { PortalOwnerProperty } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import {
  formatDate,
  formatMoney,
  INSTALLMENT_STATUS_META,
  periodLabel,
} from "@/lib/format"
import { useOwnerMe, useOwnerProperties } from "@/lib/portal-api"

/** Mis propiedades (PRD 15.1): estado de cada una y el pago del mes. */
export function OwnerPropertiesScreen() {
  const me = useOwnerMe()
  const query = useOwnerProperties()

  if (me.isPending || query.isPending) return <PageSkeleton cards={3} />
  if (me.isError || query.isError) {
    return (
      <EmptyState
        title="No pudimos cargar tus propiedades"
        description={apiErrorMessage(
          me.error ?? query.error,
          "Probá de nuevo en un rato."
        )}
        action={
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Hola, {me.data.fullName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tus propiedades administradas por {me.data.agency.name}.
        </p>
      </div>
      {query.data.length === 0 ? (
        <EmptyState
          title="Todavía no tenés propiedades cargadas"
          description="La inmobiliaria las carga desde su sistema."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {query.data.map((property) => (
            <li key={property.id}>
              <PropertyCard property={property} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PropertyCard({ property }: { property: PortalOwnerProperty }) {
  const contract = property.contract
  const installment = property.currentInstallment
  const meta = installment ? INSTALLMENT_STATUS_META[installment.status] : null
  return (
    <Link
      href={`/propietario/pagos?propertyId=${property.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="min-w-0">
        <p className="font-medium">{property.address}</p>
        {contract ? (
          <p className="text-sm text-muted-foreground">
            {contract.renter.fullName} · hasta el {formatDate(contract.endDate)}{" "}
            ·{" "}
            <span className="tabular-nums">
              {formatMoney(contract.currentRent, contract.currency)}
            </span>
            {contract.collectionMode === "OWNER_DIRECT" && " · cobrás directo"}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Sin contrato vigente</p>
        )}
        {installment && meta && (
          <p className="mt-1 text-sm">
            <Badge variant={meta.badge}>{meta.label}</Badge>
            <span className="ml-2 text-muted-foreground capitalize">
              cuota de {periodLabel(installment.period)}
            </span>
          </p>
        )}
      </div>
      <ChevronRight
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground"
      />
    </Link>
  )
}
