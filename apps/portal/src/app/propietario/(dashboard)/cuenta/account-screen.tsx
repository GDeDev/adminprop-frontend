"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { PortalOwnerAccount } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import {
  formatMoney,
  isZero,
  periodLabel,
  SETTLEMENT_STATUS_META,
} from "@/lib/format"
import { useOwnerAccount } from "@/lib/portal-api"

function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function shiftPeriod(period: string, months: number): string {
  const [year, month] = period.split("-").map(Number)
  const date = new Date(Date.UTC(year!, month! - 1 + months, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

/** Estado de cuenta del mes (PRD 15.1): por propiedad, lo devengado, cobrado, pendiente y liquidado. */
export function OwnerAccountScreen() {
  const [period, setPeriod] = React.useState(currentPeriod())
  const query = useOwnerAccount(period)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Estado de cuenta
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Mes anterior"
            onClick={() => setPeriod(shiftPeriod(period, -1))}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <span className="font-display text-lg font-semibold capitalize">
            {periodLabel(period)}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Mes siguiente"
            onClick={() => setPeriod(shiftPeriod(period, 1))}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
      {query.isPending ? (
        <PageSkeleton cards={2} />
      ) : query.isError ? (
        <EmptyState
          title="No pudimos cargar tu estado de cuenta"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : (
        <Account account={query.data} />
      )}
    </div>
  )
}

function Account({ account }: { account: PortalOwnerAccount }) {
  return (
    <>
      {account.totals.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {account.totals.map((total) => (
            <React.Fragment key={total.currency}>
              <Stat
                label={`Alquileres del mes · ${total.currency}`}
                value={formatMoney(total.accrued, total.currency)}
              />
              <Stat
                label="Cobrado"
                value={formatMoney(total.collected, total.currency)}
              />
              <Stat
                label="Pendiente"
                value={formatMoney(total.pending, total.currency)}
                warn={!isZero(total.pending)}
              />
              <Stat
                label="Liquidado a vos"
                value={formatMoney(total.netSettled, total.currency)}
                hint={`transferido ${formatMoney(total.transferred, total.currency)}`}
              />
            </React.Fragment>
          ))}
        </div>
      )}

      {account.properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin movimientos este mes.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {account.properties.map((row) => {
            const money = (amount: string) => formatMoney(amount, row.currency)
            return (
              <li
                key={row.property.id}
                className="rounded-xl border bg-card p-4"
              >
                <p className="font-medium">{row.property.address}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                  <Item label="Alquiler" value={money(row.accrued)} />
                  <Item label="Cobrado" value={money(row.collected)} />
                  <Item label="Pendiente" value={money(row.pending)} />
                  <Item label="Punitorios" value={money(row.lateFee)} />
                </dl>
                {row.settlements.length > 0 && (
                  <ul className="mt-3 flex flex-col divide-y text-sm">
                    {row.settlements.map((settlement) => {
                      const meta = SETTLEMENT_STATUS_META[settlement.status]
                      return (
                        <li
                          key={settlement.id}
                          className="flex items-center justify-between gap-2 py-2"
                        >
                          <Link
                            href={`/propietario/liquidaciones/${settlement.id}`}
                            className="hover:underline"
                          >
                            Liquidación {settlement.period}
                            {settlement.sequence > 1 &&
                              ` · ${settlement.sequence}`}
                          </Link>
                          <span className="flex items-center gap-2">
                            <span className="tabular-nums">
                              {money(settlement.netAmount)}
                            </span>
                            <Badge variant={meta.badge}>{meta.label}</Badge>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {account.fees.some((f) => !isZero(f.pending)) && (
        <section className="rounded-xl border bg-card p-4 text-sm">
          <h2 className="font-display text-base font-semibold">
            Honorarios de la inmobiliaria
          </h2>
          <ul className="mt-2 flex flex-col gap-1">
            {account.fees.map((fee) => (
              <li key={fee.currency} className="tabular-nums">
                {fee.currency}: devengados{" "}
                {formatMoney(fee.accrued, fee.currency)} · pagados{" "}
                {formatMoney(fee.collected, fee.currency)} · pendientes{" "}
                <strong>{formatMoney(fee.pending, fee.currency)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function Stat({
  label,
  value,
  hint,
  warn,
}: {
  label: string
  value: string
  hint?: string
  warn?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`font-display text-xl font-semibold tabular-nums ${warn ? "text-warning" : ""}`}
      >
        {value}
      </p>
      {hint && (
        <p className="text-xs text-muted-foreground tabular-nums">{hint}</p>
      )}
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
