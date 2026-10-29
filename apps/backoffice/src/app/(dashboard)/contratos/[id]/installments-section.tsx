"use client"

import Link from "next/link"

import { apiErrorMessage } from "@adminprop/session/client"
import type { ContractDetail } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"

import { periodLabel } from "@/lib/billing"
import { useContractInstallments } from "@/lib/billing-api"
import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"

import { InstallmentBadges } from "../../cobros/billing-screen"

/**
 * "Estado mes a mes" de la ficha del contrato (spec Fase 9, 5.2; Fase 11):
 * cada cuota con lo pagado y el saldo, con link a su ficha.
 */
export function InstallmentsSection({
  contract,
}: {
  contract: Pick<ContractDetail, "id" | "currency">
}) {
  const query = useContractInstallments(contract.id)
  const money = (amount: string) => formatMoney(amount, contract.currency)

  return (
    <section
      className="rounded-xl border bg-card p-4 md:col-span-2"
      aria-labelledby="contract-installments-title"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="contract-installments-title"
          className="font-display text-lg font-semibold"
        >
          Estado mes a mes
        </h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/cobros">Ir a cobros</Link>
        </Button>
      </div>
      {query.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(query.error, "No se pudieron cargar las cuotas.")}
        </p>
      ) : query.data.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay cuotas generadas para este contrato.
        </p>
      ) : (
        <>
          <ul className="flex flex-col divide-y text-sm md:hidden">
            {query.data.data.map((installment) => (
              <li key={installment.id} className="flex flex-col gap-1 py-2">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/cobros/${installment.id}`}
                    className="font-medium capitalize hover:underline"
                  >
                    {periodLabel(installment.period)}
                  </Link>
                  <InstallmentBadges installment={installment} />
                </div>
                <p className="text-muted-foreground tabular-nums">
                  {money(installment.baseAmount)} · pagado{" "}
                  {money(installment.paidTotal)} · saldo{" "}
                  {money(installment.totalDue)}
                </p>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Alquiler</TableHead>
                  <TableHead className="text-right">Punitorio</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell>
                      <Link
                        href={`/cobros/${installment.id}`}
                        className="font-medium capitalize hover:underline"
                      >
                        {periodLabel(installment.period)}
                      </Link>
                      {installment.paidAt && (
                        <p className="text-xs text-muted-foreground">
                          Pagó el {formatDate(installment.paidAt)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {money(installment.baseAmount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {money(installment.lateFeeAccrued)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {money(installment.paidTotal)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {money(installment.totalDue)}
                    </TableCell>
                    <TableCell>
                      <InstallmentBadges installment={installment} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  )
}
