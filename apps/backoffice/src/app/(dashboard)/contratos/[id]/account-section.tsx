"use client"

import * as React from "react"
import Link from "next/link"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  AccountMovementType,
  ContractAccount,
  ContractDetail,
} from "@adminprop/shared-types"
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

import {
  COLLECTION_MODE_LABELS,
  DEPOSIT_RETURN_MODE_LABELS,
  FEE_MODE_LABELS,
  isZero,
} from "@/lib/billing"
import { useContractAccount } from "@/lib/billing-api"
import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"

import { DepositReturnDialog } from "./deposit-return-dialog"

const MOVEMENT_LABELS: Record<AccountMovementType, string> = {
  INSTALLMENT: "Cuota",
  CHARGE: "Cargo",
  LATE_FEE_ACCRUED: "Punitorio devengado",
  PAYMENT: "Pago",
  CREDIT_APPLIED: "Saldo a favor aplicado",
  CREDIT_GENERATED: "Saldo a favor generado",
  CREDIT_REFUNDED: "Devolución de saldo",
  LATE_FEE_ADJUSTMENT: "Ajuste de punitorio",
  PAYMENT_VOIDED: "Pago anulado",
  DEPOSIT_RECEIVED: "Depósito recibido",
  DEPOSIT_RETURNED: "Depósito devuelto",
  DEPOSIT_DEDUCTION: "Deducción del depósito",
}

const PREVIEW_ROWS = 8

/**
 * Cuenta corriente del contrato (Micaela #8): devengado, cobrado, pendiente,
 * punitorios, saldos a favor y el depósito, con los movimientos cronológicos.
 */
export function AccountSection({
  contract,
}: {
  contract: Pick<ContractDetail, "id" | "currency" | "status">
}) {
  const query = useContractAccount(contract.id)
  const [expanded, setExpanded] = React.useState(false)
  const [returning, setReturning] = React.useState(false)
  // El depósito se devuelve al terminar el contrato (A-13, PRD 11.5).
  const canReturnDeposit = contract.status !== "ACTIVE"

  return (
    <section
      className="rounded-xl border bg-card p-4 md:col-span-2"
      aria-labelledby="contract-account-title"
    >
      <h2
        id="contract-account-title"
        className="mb-3 font-display text-lg font-semibold"
      >
        Cuenta corriente
      </h2>
      {query.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-10" />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(
            query.error,
            "No se pudo cargar la cuenta corriente."
          )}
        </p>
      ) : (
        <>
          <Account
            account={query.data}
            expanded={expanded}
            onExpand={() => setExpanded(true)}
          />
          {canReturnDeposit && !query.data.deposit.returned && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReturning(true)}
              >
                Devolver depósito
              </Button>
            </div>
          )}
          {returning && (
            <DepositReturnDialog
              contractId={contract.id}
              deposit={query.data.deposit}
              installments={query.data.installments
                .filter((i) => i.status !== "PAID")
                .map((i) => ({
                  id: i.id,
                  period: i.period,
                  totalDue: i.totalDue,
                }))}
              open
              onOpenChange={(open) => !open && setReturning(false)}
            />
          )}
        </>
      )}
    </section>
  )
}

function Account({
  account,
  expanded,
  onExpand,
}: {
  account: ContractAccount
  expanded: boolean
  onExpand: () => void
}) {
  const money = (amount: string) =>
    formatMoney(amount, account.contract.currency)
  const { totals, deposit } = account
  const movements = [...account.movements].reverse()
  const visible = expanded ? movements : movements.slice(0, PREVIEW_ROWS)

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <Total label="Devengado" value={money(totals.accrued)} />
        <Total label="Cobrado" value={money(totals.collected)} />
        <Total
          label="Pendiente"
          value={money(totals.balance)}
          tone={isZero(totals.balance) ? undefined : "warning"}
        />
        <Total
          label="Punitorios"
          value={money(totals.lateFeeAccrued)}
          hint={
            isZero(totals.lateFeeAdjusted)
              ? undefined
              : `−${money(totals.lateFeeAdjusted)} ajustados`
          }
        />
        <Total label="Saldo a favor" value={money(totals.creditsAvailable)} />
        <Total
          label="Honorarios devengados"
          value={money(totals.feeAccruedOnCollected)}
          hint={`${money(totals.feeAccruedOnBase)} sobre el total`}
        />
      </dl>
      <p className="text-xs text-muted-foreground tabular-nums">
        {COLLECTION_MODE_LABELS[account.contract.collectionMode]} ·{" "}
        {FEE_MODE_LABELS[account.contract.feeMode]}
        {!isZero(totals.collectedByOwner) &&
          ` · ${money(totals.collectedByOwner)} cobrados por el propietario`}
        {!isZero(totals.pendingConfirmation) &&
          ` · ${money(totals.pendingConfirmation)} informados sin confirmar`}
      </p>

      <div className="rounded-lg bg-muted p-3 text-sm">
        <p className="font-medium">
          Depósito: {formatMoney(deposit.amount, deposit.currency)}
        </p>
        <p className="text-muted-foreground">
          {DEPOSIT_RETURN_MODE_LABELS[deposit.returnMode]}
          {deposit.suggestedReturn &&
            !deposit.returned &&
            ` · a devolver hoy: ${formatMoney(deposit.suggestedReturn, deposit.currency)}`}
        </p>
        {deposit.returned && (
          <p className="mt-1">
            Devuelto el {formatDate(deposit.returned.returnedAt)}:{" "}
            <span className="tabular-nums">
              {formatMoney(deposit.returned.returnedAmount, deposit.currency)}
            </span>
            {deposit.returned.deductions.length > 0 &&
              ` · ${deposit.returned.deductions.length} ${
                deposit.returned.deductions.length === 1
                  ? "deducción"
                  : "deducciones"
              }`}
          </p>
        )}
      </div>

      {movements.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin movimientos.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Movimiento</TableHead>
                <TableHead className="text-right">Debe</TableHead>
                <TableHead className="text-right">Haber</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((movement, index) => (
                <TableRow key={`${movement.date}-${movement.type}-${index}`}>
                  <TableCell className="tabular-nums">
                    {formatDate(movement.date)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {MOVEMENT_LABELS[movement.type]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {movement.installmentId ? (
                        <Link
                          href={`/cobros/${movement.installmentId}`}
                          className="hover:underline"
                        >
                          {movement.description}
                        </Link>
                      ) : (
                        movement.description
                      )}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {movement.debit ? money(movement.debit) : ""}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {movement.credit ? money(movement.credit) : ""}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {money(movement.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!expanded && movements.length > PREVIEW_ROWS && (
            <Button variant="outline" size="sm" onClick={onExpand}>
              Ver los {movements.length} movimientos
            </Button>
          )}
        </>
      )}
    </div>
  )
}

function Total({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: "warning"
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`font-display font-semibold tabular-nums ${
          tone === "warning" ? "text-warning" : ""
        }`}
      >
        {value}
      </dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  )
}
