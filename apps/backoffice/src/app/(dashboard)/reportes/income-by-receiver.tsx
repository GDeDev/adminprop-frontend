import * as React from "react"
import { Building2, Landmark, Wallet } from "lucide-react"

import type { IncomeReport } from "@adminprop/shared-types"
import { StatCard } from "@adminprop/ui/components/stat-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"

import { periodLabel } from "@/lib/billing"
import { formatMoney } from "@/lib/contracts"

type Currency = IncomeReport["rows"][number]["currency"]
type Breakdown = IncomeReport["totals"][number]["collected"]

const RIGHT = "text-right font-display num"

/**
 * Los montos llegan de la API ya sumados: acá solo se muestran. Cada moneda
 * va por separado y nunca se suman entre sí (ARS y USD).
 */
function BreakdownCells({
  breakdown,
  currency,
}: {
  breakdown: Breakdown
  currency: Currency
}) {
  return (
    <>
      <TableCell className={RIGHT}>
        {formatMoney(breakdown.rent, currency)}
      </TableCell>
      <TableCell className={RIGHT}>
        {formatMoney(breakdown.lateFees, currency)}
      </TableCell>
      <TableCell className={RIGHT}>
        {formatMoney(breakdown.charges, currency)}
      </TableCell>
      <TableCell className={`${RIGHT} font-semibold`}>
        {formatMoney(breakdown.total, currency)}
      </TableCell>
    </>
  )
}

function AmountHeads() {
  return (
    <>
      {["Alquiler", "Punitorios", "Cargos", "Total"].map((label) => (
        <TableHead key={label} className="text-right">
          {label}
        </TableHead>
      ))}
    </>
  )
}

/** Totales del rango, uno por moneda, con lo cobrado según quién lo recibió. */
export function IncomeTotals({ totals }: { totals: IncomeReport["totals"] }) {
  if (totals.length === 0) return null
  return (
    <section
      aria-labelledby="income-totals-title"
      className="flex flex-col gap-4 p-3"
    >
      <div>
        <h3 id="income-totals-title" className="font-display text-title-md">
          Totales del período por moneda
        </h3>
        <p className="text-xs text-muted-foreground">
          Cada moneda se muestra aparte: no se suman pesos con dólares.
        </p>
      </div>
      {totals.map((total) => (
        <div
          key={total.currency}
          role="group"
          aria-label={`Totales en ${total.currency}`}
          className="flex flex-col gap-3"
        >
          <h4 className="text-sm font-medium">{total.currency}</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              animate={false}
              icon={Wallet}
              label={`Todo lo cobrado (${total.currency})`}
              value={formatMoney(total.collected.total, total.currency)}
            />
            <StatCard
              animate={false}
              icon={Building2}
              label="Cobrado por la inmobiliaria"
              value={formatMoney(
                total.collectedByReceiver.agency.total,
                total.currency
              )}
              hint="Pasó por la administración"
            />
            <StatCard
              animate={false}
              icon={Landmark}
              label="Percibido por el propietario"
              value={formatMoney(
                total.collectedByReceiver.owner.total,
                total.currency
              )}
              hint="No pasó por la inmobiliaria"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quién lo cobró</TableHead>
                <AmountHeads />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Inmobiliaria</TableCell>
                <BreakdownCells
                  breakdown={total.collectedByReceiver.agency}
                  currency={total.currency}
                />
              </TableRow>
              <TableRow>
                <TableCell>Propietario</TableCell>
                <BreakdownCells
                  breakdown={total.collectedByReceiver.owner}
                  currency={total.currency}
                />
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Todo</TableCell>
                <BreakdownCells
                  breakdown={total.collected}
                  currency={total.currency}
                />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ))}
    </section>
  )
}

/** Cada mes y moneda, separado entre lo que cobró la inmobiliaria y el propietario. */
export function IncomeByReceiverTable({
  rows,
}: {
  rows: IncomeReport["rows"]
}) {
  return (
    <section
      aria-labelledby="income-receiver-title"
      className="flex flex-col gap-2 p-3"
    >
      <div>
        <h3 id="income-receiver-title" className="font-display text-title-md">
          Quién cobró, mes a mes
        </h3>
        <p className="text-xs text-muted-foreground">
          Lo que cobró la inmobiliaria es lo que se liquida al propietario; lo
          que percibió el propietario no pasó por la administración.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mes</TableHead>
            <TableHead>Moneda</TableHead>
            <TableHead>Cobró</TableHead>
            <AmountHeads />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.flatMap((row) =>
            (
              [
                ["Inmobiliaria", row.collectedByReceiver.agency],
                ["Propietario", row.collectedByReceiver.owner],
              ] as const
            ).map(([who, breakdown]) => (
              <TableRow key={`${row.period}-${row.currency}-${who}`}>
                <TableCell>{periodLabel(row.period)}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell>{who}</TableCell>
                <BreakdownCells breakdown={breakdown} currency={row.currency} />
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  )
}
