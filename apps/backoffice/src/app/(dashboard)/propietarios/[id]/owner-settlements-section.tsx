"use client"

import * as React from "react"
import Link from "next/link"
import { Pencil, Plus } from "lucide-react"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type {
  OwnerDetail,
  OwnerFeeAccountTotals,
  OwnerFeeSettings,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { LoadMore } from "@/components/load-more"
import { isZero } from "@/lib/billing"
import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"
import {
  FEE_MOVEMENT_LABELS,
  FEE_RECEIVABLE_STATUS_META,
  SEND_MODE_LABELS,
  SETTLEMENT_STATUS_META,
  settlementLabel,
} from "@/lib/settlements"
import {
  useInfiniteOwnerSettlements,
  useOwnerFeeAccount,
} from "@/lib/settlements-api"

import { FeePaymentDialog } from "../../liquidaciones/fee-payment-dialog"
import { OwnerFeeSettingsDialog } from "./owner-fee-settings-dialog"

/** Historial de liquidaciones del propietario (PRD 12.5, spec 5.3). */
export function OwnerSettlementsSection({ owner }: { owner: OwnerDetail }) {
  const query = useInfiniteOwnerSettlements(owner.id)
  const settlements = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <section
      className="rounded-xl border bg-card p-4 md:col-span-2"
      aria-labelledby="owner-settlements-title"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="owner-settlements-title"
          className="font-display text-lg font-semibold"
        >
          Historial de liquidaciones
        </h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/liquidaciones">Ir a liquidaciones</Link>
        </Button>
      </div>
      {query.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(
            query.error,
            "No se pudieron cargar las liquidaciones."
          )}
        </p>
      ) : settlements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay liquidaciones para este propietario.
        </p>
      ) : (
        <>
          <ul className="flex flex-col divide-y text-sm">
            {settlements.map((settlement) => {
              const meta = SETTLEMENT_STATUS_META[settlement.status]
              const money = (amount: string) =>
                formatMoney(amount, settlement.currency)
              return (
                <li
                  key={settlement.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/liquidaciones/${settlement.id}`}
                      className="font-medium hover:underline"
                    >
                      {settlement.property?.address ?? "Propiedad eliminada"} ·{" "}
                      {settlementLabel(settlement)}
                    </Link>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Alquiler {money(settlement.rentTotal)} · honorarios{" "}
                      {money(settlement.feeTotal)}
                      {!isZero(settlement.transferredTotal) &&
                        ` · transferido ${money(settlement.transferredTotal)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">
                      {money(settlement.netAmount)}
                    </span>
                    <Badge variant={meta.badge}>{meta.label}</Badge>
                  </div>
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

/**
 * Cuenta de honorarios del propietario (Micaela 9B y 10): devengados,
 * cobrados y pendientes, con sus movimientos; registrar un pago. Más la
 * configuración de honorarios y envío (admin).
 */
export function OwnerFeeAccountSection({
  owner,
  feeSettings,
}: {
  owner: OwnerDetail
  /** Llega con el contrato de la API de la Fase 12; hasta entonces puede faltar. */
  feeSettings: OwnerFeeSettings | undefined
}) {
  const { user } = useSession()
  const isAdmin = user?.role === "ADMIN"
  const query = useOwnerFeeAccount(owner.id)
  const [paying, setPaying] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)
  const ownerRef = { id: owner.id, fullName: owner.fullName }

  return (
    <section
      className="rounded-xl border bg-card p-4 md:col-span-2"
      aria-labelledby="owner-fees-title"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="owner-fees-title"
          className="font-display text-lg font-semibold"
        >
          Honorarios
        </h2>
        <div className="flex gap-2">
          {isAdmin && feeSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil aria-hidden />
              Configurar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setPaying(true)}>
            <Plus aria-hidden />
            Registrar pago
          </Button>
        </div>
      </div>

      {feeSettings && (
        <p className="mb-3 text-sm text-muted-foreground">
          {feeSettings.feePercentage
            ? `${feeSettings.feePercentage} % propio para sus contratos nuevos`
            : "Porcentaje según la regla de la inmobiliaria (estándar o reducido)"}
          {" · base: alquiler"}
          {feeSettings.feeIncludesLateFees && " + punitorios"}
          {feeSettings.feeIncludesCharges && " + cargos"}
          {" · envío: "}
          {SEND_MODE_LABELS[feeSettings.statementSendMode].toLowerCase()}
        </p>
      )}

      {query.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-10" />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(
            query.error,
            "No se pudo cargar la cuenta de honorarios."
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          {query.data.totals.length === 0 ? (
            <p className="text-muted-foreground">
              Sin honorarios pendientes: se descuentan en cada liquidación.
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {query.data.totals.map((total) => (
                <Totals key={total.currency} total={total} />
              ))}
            </dl>
          )}
          {query.data.receivables.some(
            (r) => r.status !== "PAID" && r.status !== "VOIDED"
          ) && (
            <ul className="flex flex-col divide-y">
              {query.data.receivables
                .filter((r) => r.status !== "PAID" && r.status !== "VOIDED")
                .map((receivable) => {
                  const meta = FEE_RECEIVABLE_STATUS_META[receivable.status]
                  return (
                    <li
                      key={receivable.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <span>
                        {receivable.property?.address ?? "Propiedad eliminada"}{" "}
                        · cuota {receivable.installmentPeriod}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums">
                          {formatMoney(receivable.amount, receivable.currency)}
                        </span>
                        <Badge variant={meta.badge}>{meta.label}</Badge>
                      </span>
                    </li>
                  )
                })}
            </ul>
          )}
          {query.data.movements.length > 0 && (
            <div>
              <button
                type="button"
                className="font-medium underline-offset-2 hover:underline"
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll
                  ? "Ocultar movimientos"
                  : `Ver movimientos (${query.data.movements.length})`}
              </button>
              {showAll && (
                <ul className="mt-2 flex flex-col divide-y">
                  {[...query.data.movements]
                    .reverse()
                    .map((movement, index) => (
                      <li
                        key={`${movement.date}-${index}`}
                        className="flex justify-between gap-2 py-1.5"
                      >
                        <span>
                          <span className="text-muted-foreground tabular-nums">
                            {formatDate(movement.date)}
                          </span>{" "}
                          {FEE_MOVEMENT_LABELS[movement.type]} ·{" "}
                          {movement.description}
                        </span>
                        <span className="tabular-nums">
                          {movement.debit &&
                            `+${formatMoney(movement.debit, movement.currency)}`}
                          {movement.credit &&
                            `−${formatMoney(movement.credit, movement.currency)}`}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {paying && (
        <FeePaymentDialog
          owner={ownerRef}
          open
          onOpenChange={(open) => !open && setPaying(false)}
        />
      )}
      {editing && feeSettings && (
        <OwnerFeeSettingsDialog
          ownerId={owner.id}
          settings={feeSettings}
          open
          onOpenChange={(open) => !open && setEditing(false)}
        />
      )}
    </section>
  )
}

function Totals({ total }: { total: OwnerFeeAccountTotals }) {
  const money = (amount: string) => formatMoney(amount, total.currency)
  return (
    <>
      <div>
        <dt className="text-xs text-muted-foreground">
          Devengados · {total.currency}
        </dt>
        <dd className="font-display font-semibold tabular-nums">
          {money(total.accrued)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Cobrados</dt>
        <dd className="font-display font-semibold tabular-nums">
          {money(total.collected)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Pendientes</dt>
        <dd
          className={`font-display font-semibold tabular-nums ${isZero(total.pending) ? "" : "text-warning"}`}
        >
          {money(total.pending)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">A cuenta</dt>
        <dd className="font-display font-semibold tabular-nums">
          {money(total.unallocated)}
        </dd>
      </div>
    </>
  )
}
