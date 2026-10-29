"use client"

import { apiErrorMessage } from "@adminprop/session/client"
import type { PortalRenterContract } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Progress } from "@adminprop/ui/components/progress"

import {
  COLLECTION_MODE_LABELS,
  DEPOSIT_RETURN_MODE_LABELS,
  formatDate,
  formatMoney,
  RENT_UPDATE_FREQUENCY_LABELS,
  RENT_UPDATE_TYPE_LABELS,
} from "@/lib/format"
import { useRenterContract } from "@/lib/portal-api"

/** Datos del contrato del inquilino (PRD 15.2). */
export function RenterContractScreen() {
  const query = useRenterContract()

  if (query.isPending) return <PageSkeleton cards={2} />
  if (query.isError) {
    return (
      <EmptyState
        title="No pudimos cargar tu contrato"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        }
      />
    )
  }
  if (!query.data) {
    return (
      <EmptyState
        title="No tenés un contrato cargado"
        description="Si creés que es un error, escribile a la inmobiliaria."
      />
    )
  }
  return <Contract contract={query.data} />
}

function Contract({ contract }: { contract: PortalRenterContract }) {
  const money = (amount: string) => formatMoney(amount, contract.currency)
  const finished = contract.status !== "ACTIVE"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {contract.property.address}
        </h1>
        <p className="text-sm text-muted-foreground">
          {contract.property.propertyType
            ? `${contract.property.propertyType} · `
            : ""}
          {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
          {finished && (
            <Badge variant="borrador" className="ml-2">
              Contrato finalizado
            </Badge>
          )}
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <Progress
          value={contract.timeline.progressPercent}
          aria-label="Avance del contrato"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          {contract.timeline.elapsedMonths} de {contract.timeline.totalMonths}{" "}
          meses
        </p>
      </section>

      <section
        className="rounded-xl border bg-card p-5"
        aria-labelledby="terms-title"
      >
        <h2 id="terms-title" className="font-display text-lg font-semibold">
          Condiciones
        </h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Alquiler vigente</dt>
          <dd className="font-display text-lg font-semibold tabular-nums">
            {money(contract.currentRent)}
          </dd>
          <dt className="text-muted-foreground">Actualización</dt>
          <dd>
            {RENT_UPDATE_TYPE_LABELS[contract.rentUpdateType]},{" "}
            {RENT_UPDATE_FREQUENCY_LABELS[contract.rentUpdateFrequency]}
            {contract.nextRentUpdateOn &&
              ` · próximo aumento: ${formatDate(contract.nextRentUpdateOn)}`}
          </dd>
          <dt className="text-muted-foreground">Depósito</dt>
          <dd>
            {formatMoney(contract.deposit, contract.depositCurrency)}
            <p className="text-xs text-muted-foreground">
              Al terminar,{" "}
              {DEPOSIT_RETURN_MODE_LABELS[contract.depositReturnMode]}.
            </p>
          </dd>
          <dt className="text-muted-foreground">Pago</dt>
          <dd>
            {COLLECTION_MODE_LABELS[contract.collectionMode]}
            {contract.feePaidByRenter && (
              <p className="text-xs text-muted-foreground">
                Además pagás a la inmobiliaria sus honorarios por cuenta del
                propietario:{" "}
                {contract.feePaidByRenter.feeAmount
                  ? `${money(contract.feePaidByRenter.feeAmount)} por mes`
                  : `${contract.feePaidByRenter.feePercentage} % del alquiler`}
                .
              </p>
            )}
          </dd>
          {contract.guarantor && (
            <>
              <dt className="text-muted-foreground">Garante</dt>
              <dd>{contract.guarantor.fullName}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Seguro de caución</dt>
          <dd>
            {contract.surety.hasSurety
              ? `Sí${contract.surety.policyExpiresAt ? ` · vence el ${formatDate(contract.surety.policyExpiresAt)}` : ""}`
              : "No"}
          </dd>
        </dl>
      </section>

      <section
        className="rounded-xl border bg-card p-5"
        aria-labelledby="services-title"
      >
        <h2 id="services-title" className="font-display text-lg font-semibold">
          Servicios
        </h2>
        {contract.services.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Sin servicios cargados.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y text-sm">
            {contract.services.map((service) => (
              <li
                key={service.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span>
                  {service.serviceType?.name ?? "Servicio"}
                  <span className="text-muted-foreground">
                    {" "}
                    · lo paga{" "}
                    {service.paidBy === "RENTER"
                      ? "el inquilino"
                      : "el propietario"}
                  </span>
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {service.hasDueDate && service.dueDate
                    ? `vence el ${formatDate(service.dueDate)}`
                    : "sin vencimiento"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
