"use client"

import Link from "next/link"
import { CheckCircle2, ChevronLeft, FileDown } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import {
  formatDate,
  formatMoney,
  isZero,
  PAYMENT_METHOD_LABELS,
  periodLabel,
  SETTLEMENT_STATUS_META,
} from "@/lib/format"
import {
  ownerSettlementPdfUrl,
  useAcknowledgeSettlement,
  useOwnerSettlement,
} from "@/lib/portal-api"

/** Detalle de una liquidación para el propietario: desglose legible y acuse de recibo (A-33). */
export function OwnerSettlementDetailScreen({ id }: { id: string }) {
  const query = useOwnerSettlement(id)
  const acknowledge = useAcknowledgeSettlement()

  if (query.isPending) return <PageSkeleton cards={2} />
  if (query.isError) {
    return (
      <EmptyState
        title="No pudimos cargar la liquidación"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button variant="outline" asChild>
            <Link href="/propietario/liquidaciones">Volver</Link>
          </Button>
        }
      />
    )
  }

  const settlement = query.data
  const money = (amount: string) => formatMoney(amount, settlement.currency)
  const meta = SETTLEMENT_STATUS_META[settlement.status]
  const transfers = settlement.transfers.filter((t) => !t.voidedAt)

  async function confirmReceipt() {
    try {
      await acknowledge.mutateAsync(settlement.id)
      toast.success("Gracias, quedó registrado que recibiste la transferencia.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo registrar."))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/propietario/liquidaciones"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Liquidaciones
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {settlement.property?.address ?? "Propiedad"}
        </h1>
        <p className="text-sm text-muted-foreground capitalize">
          Liquidación de {periodLabel(settlement.period)}
          {settlement.sequence > 1 && ` (${settlement.sequence})`}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant={meta.badge}>{meta.label}</Badge>
          {settlement.acknowledgedAt && (
            <Badge variant="outline">
              Recibida el {formatDate(settlement.acknowledgedAt)}
            </Badge>
          )}
        </div>
      </div>

      <section
        className="rounded-xl border bg-card p-5"
        aria-labelledby="breakdown-title"
      >
        <h2 id="breakdown-title" className="font-display text-lg font-semibold">
          Desglose
        </h2>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
          <Row label="Alquiler cobrado" value={money(settlement.rentTotal)} />
          {!isZero(settlement.lateFeeTotal) && (
            <Row
              label="Punitorios cobrados"
              value={money(settlement.lateFeeTotal)}
            />
          )}
          {!isZero(settlement.ownerChargesTotal) && (
            <Row
              label="Otros conceptos"
              value={money(settlement.ownerChargesTotal)}
            />
          )}
          <Row
            label={`Honorarios${settlement.feeDeducted ? "" : " (los pagás aparte)"}`}
            value={
              settlement.feeDeducted
                ? `−${money(settlement.feeTotal)}`
                : money(settlement.feeTotal)
            }
          />
          {!isZero(settlement.expensesTotal) && (
            <Row
              label="Gastos adelantados por el inquilino"
              value={`−${money(settlement.expensesTotal)}`}
            />
          )}
          {!isZero(settlement.adjustmentsTotal) && (
            <Row
              label="Retenciones y ajustes"
              value={
                settlement.adjustmentsTotal.startsWith("-")
                  ? `−${money(settlement.adjustmentsTotal.slice(1))}`
                  : money(settlement.adjustmentsTotal)
              }
            />
          )}
          <dt className="border-t pt-2 font-medium">Neto a transferirte</dt>
          <dd className="border-t pt-2 text-right font-display text-xl font-semibold tabular-nums">
            {money(settlement.netAmount)}
          </dd>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">
          Honorarios:{" "}
          {settlement.feeAmountFixed
            ? `${money(settlement.feeAmountFixed)} fijos`
            : `${settlement.feePercentage} % sobre ${money(settlement.feeBase)}`}
          .
        </p>
      </section>

      {settlement.expenses.length > 0 && (
        <section className="rounded-xl border bg-card p-5 text-sm">
          <h2 className="font-display text-base font-semibold">
            Gastos descontados
          </h2>
          <ul className="mt-2 flex flex-col divide-y">
            {settlement.expenses.map((expense) => (
              <li
                key={expense.expenseId}
                className="flex justify-between gap-2 py-1.5"
              >
                <span>
                  {expense.description}{" "}
                  <span className="text-muted-foreground">
                    · {formatDate(expense.expenseDate)}
                  </span>
                </span>
                <span className="tabular-nums">−{money(expense.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        className="rounded-xl border bg-card p-5 text-sm"
        aria-labelledby="transfers-title"
      >
        <h2
          id="transfers-title"
          className="font-display text-base font-semibold"
        >
          Transferencias
        </h2>
        {transfers.length === 0 ? (
          <p className="mt-2 text-muted-foreground">
            {settlement.status === "PENDING"
              ? "La inmobiliaria todavía está preparando la liquidación."
              : "Todavía no se registró la transferencia."}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y">
            {transfers.map((transfer) => (
              <li
                key={transfer.id}
                className="flex justify-between gap-2 py-1.5"
              >
                <span>
                  {formatDate(transfer.transferredAt)} ·{" "}
                  {PAYMENT_METHOD_LABELS[transfer.method]}
                </span>
                <span className="tabular-nums">{money(transfer.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {settlement.status !== "PENDING" &&
            settlement.status !== "CANCELLED" && (
              <Button variant="outline" asChild>
                <a
                  href={ownerSettlementPdfUrl(settlement.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileDown aria-hidden />
                  Descargar PDF
                </a>
              </Button>
            )}
          {settlement.status === "TRANSFERRED" &&
            !settlement.acknowledgedAt && (
              <Button
                onClick={() => void confirmReceipt()}
                disabled={acknowledge.isPending}
              >
                <CheckCircle2 aria-hidden />
                Recibí la transferencia
              </Button>
            )}
        </div>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </>
  )
}
