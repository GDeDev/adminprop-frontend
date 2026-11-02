"use client"

import * as React from "react"
import Link from "next/link"
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  Landmark,
  Plus,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type {
  SettlementAdjustment,
  SettlementDetail,
  SettlementTransfer,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { DownloadPdfButton } from "@/components/download-pdf-button"
import { FEE_MODE_LABELS, isZero, periodLabel } from "@/lib/billing"
import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"
import { PAYMENT_METHOD_LABELS } from "@/lib/billing"
import {
  ADJUSTMENT_CONCEPT_LABELS,
  adjustmentSubtracts,
  settlementLabel,
} from "@/lib/settlements"
import {
  useCancelSettlement,
  useConfirmSettlement,
  useRecalculateSettlement,
  useSettlement,
  useVoidSettlementAdjustment,
  useVoidTransfer,
} from "@/lib/settlements-api"

import { ReasonDialog } from "../../cobros/[id]/reason-dialog"
import { SettlementBadges } from "../settlements-screen"
import { AdjustmentDialog } from "./adjustment-dialog"
import { TransferDialog } from "./transfer-dialog"

type DialogState =
  | { kind: "adjustment" }
  | { kind: "transfer" }
  | { kind: "cancel" }
  | { kind: "void-adjustment"; adjustment: SettlementAdjustment }
  | { kind: "void-transfer"; transfer: SettlementTransfer }
  | null

/** Ficha de la liquidación (rediseño Fase 12, sección 7). */
export function SettlementDetailScreen({ id }: { id: string }) {
  const query = useSettlement(id)
  if (query.isPending) return <PageSkeleton cards={3} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar la liquidación"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button variant="outline" asChild>
            <Link href="/liquidaciones">Volver a liquidaciones</Link>
          </Button>
        }
      />
    )
  }
  return <Detail settlement={query.data} />
}

function Detail({ settlement }: { settlement: SettlementDetail }) {
  const { user } = useSession()
  const isAdmin = user?.role === "ADMIN"
  const [dialog, setDialog] = React.useState<DialogState>(null)
  const [dialogKey, setDialogKey] = React.useState(0)
  const recalculate = useRecalculateSettlement()
  const confirm = useConfirmSettlement()
  const cancel = useCancelSettlement()
  const voidAdjustment = useVoidSettlementAdjustment()
  const voidTransfer = useVoidTransfer()
  const money = (amount: string) => formatMoney(amount, settlement.currency)
  const pending = settlement.status === "PENDING"
  const canTransfer =
    (settlement.status === "CONFIRMED" ||
      settlement.status === "TRANSFERRED") &&
    !isZero(settlement.netAmount) &&
    !settlement.netAmount.startsWith("-")

  function open(state: DialogState) {
    setDialogKey((k) => k + 1)
    setDialog(state)
  }

  async function run(
    action: () => Promise<unknown>,
    success: string,
    failure: string
  ) {
    try {
      await action()
      toast.success(success)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, failure))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/liquidaciones"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Liquidaciones
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Liquidación {settlementLabel(settlement)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {settlement.owner ? (
                <Link
                  href={`/propietarios/${settlement.owner.id}`}
                  className="hover:underline"
                >
                  {settlement.owner.fullName}
                </Link>
              ) : (
                "Sin propietario"
              )}
              {" · "}
              {settlement.property ? (
                <Link
                  href={`/propiedades/${settlement.property.id}`}
                  className="hover:underline"
                >
                  {settlement.property.address}
                </Link>
              ) : (
                "Propiedad eliminada"
              )}
              {" · "}
              <Link
                href={`/contratos/${settlement.contract.id}`}
                className="hover:underline"
              >
                Ver contrato
              </Link>
              {settlement.statementId && (
                <>
                  {" · "}
                  <Link
                    href={`/liquidaciones/consolidados/${settlement.statementId}`}
                    className="hover:underline"
                  >
                    Ver consolidado
                  </Link>
                </>
              )}
            </p>
            <div className="mt-2">
              <SettlementBadges settlement={settlement} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pending && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    void run(
                      () => recalculate.mutateAsync(settlement.id),
                      "Liquidación recalculada.",
                      "No se pudo recalcular."
                    )
                  }
                  disabled={recalculate.isPending}
                >
                  <RefreshCw aria-hidden />
                  Recalcular
                </Button>
                <Button
                  variant="outline"
                  onClick={() => open({ kind: "adjustment" })}
                >
                  <Plus aria-hidden />
                  Agregar ajuste
                </Button>
                <Button
                  onClick={() =>
                    void run(
                      () => confirm.mutateAsync(settlement.id),
                      "Liquidación confirmada.",
                      "No se pudo confirmar."
                    )
                  }
                  disabled={confirm.isPending}
                >
                  <CheckCircle2 aria-hidden />
                  Confirmar
                </Button>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    onClick={() => open({ kind: "cancel" })}
                  >
                    <Ban aria-hidden />
                    Cancelar
                  </Button>
                )}
              </>
            )}
            {canTransfer && (
              <Button onClick={() => open({ kind: "transfer" })}>
                <Landmark aria-hidden />
                Registrar transferencia
              </Button>
            )}
            {settlement.status !== "PENDING" &&
              settlement.status !== "CANCELLED" && (
                <DownloadPdfButton
                  kind="SETTLEMENT"
                  entityId={settlement.id}
                  canRegenerate={user?.role === "ADMIN"}
                />
              )}
          </div>
        </div>
      </div>

      {settlement.ownerBankAccountMissing && (
        <Alert>
          <AlertDescription>
            El propietario no tiene cuenta bancaria cargada. Se puede confirmar
            igual (A-17), pero convendría completarla antes de transferir.
          </AlertDescription>
        </Alert>
      )}
      {settlement.cancelledAt && (
        <Alert variant="destructive">
          <AlertDescription>
            Cancelada el {formatDate(settlement.cancelledAt.slice(0, 10))}
            {settlement.cancelReason && `: ${settlement.cancelReason}`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Desglose">
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
            <Row label="Alquiler cobrado" value={money(settlement.rentTotal)} />
            <Row
              label="Punitorios cobrados"
              value={money(settlement.lateFeeTotal)}
            />
            <Row
              label="Cargos del propietario"
              value={money(settlement.ownerChargesTotal)}
            />
            <Row
              label={`Honorarios${settlement.feeDeducted ? "" : " (no se descuentan)"}`}
              value={
                settlement.feeDeducted
                  ? `−${money(settlement.feeTotal)}`
                  : money(settlement.feeTotal)
              }
              muted={!settlement.feeDeducted}
            />
            <Row
              label="Gastos adelantados"
              value={`−${money(settlement.expensesTotal)}`}
            />
            <Row
              label="Ajustes"
              value={
                settlement.adjustmentsTotal.startsWith("-")
                  ? `−${money(settlement.adjustmentsTotal.slice(1))}`
                  : money(settlement.adjustmentsTotal)
              }
            />
            <dt className="border-t pt-2 font-medium">Neto a transferir</dt>
            <dd className="border-t pt-2 text-right font-display text-xl font-semibold tabular-nums">
              {money(settlement.netAmount)}
            </dd>
            {!isZero(settlement.transferredTotal) && (
              <Row
                label="Transferido"
                value={money(settlement.transferredTotal)}
              />
            )}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Honorarios: {FEE_MODE_LABELS[settlement.feeMode].toLowerCase()} ·{" "}
            {settlement.feeAmountFixed
              ? `${money(settlement.feeAmountFixed)} fijos (prorrateados por lo cobrado)`
              : `${settlement.feePercentage} % sobre ${money(settlement.feeBase)}`}
            {settlement.mixedFeeTerms &&
              " · las cuotas incluidas tenían términos distintos"}
            {!isZero(settlement.serviceChargesTotal) &&
              ` · ${money(settlement.serviceChargesTotal)} cobrados por servicios no entran al neto (A-16)`}
          </p>
        </Section>

        <Section title="Pagos incluidos">
          {settlement.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin pagos: sólo gastos.
            </p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {settlement.payments.map((payment) => (
                <li
                  key={payment.paymentId}
                  className="flex flex-wrap justify-between gap-2 py-2"
                >
                  <div>
                    <p className="font-medium capitalize">
                      Cuota {periodLabel(payment.installmentPeriod)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Pagado el {formatDate(payment.paidAt)} · alquiler{" "}
                      {money(payment.rentApplied)}
                      {!isZero(payment.lateFeeApplied) &&
                        ` · punitorio ${money(payment.lateFeeApplied)}`}
                      {!isZero(payment.ownerChargesApplied) &&
                        ` · cargos ${money(payment.ownerChargesApplied)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Gastos adelantados descontados">
          {settlement.expenses.length === 0 &&
          settlement.skippedExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin gastos pendientes.
            </p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {settlement.expenses.map((expense) => (
                <li
                  key={expense.expenseId}
                  className="flex justify-between gap-2 py-2"
                >
                  <span>
                    {expense.description}
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      · {formatDate(expense.expenseDate)}
                    </span>
                  </span>
                  <span className="tabular-nums">−{money(expense.amount)}</span>
                </li>
              ))}
              {settlement.skippedExpenses.map((expense) => (
                <li
                  key={expense.expenseId}
                  className="flex justify-between gap-2 py-2 text-muted-foreground"
                >
                  <span>
                    {expense.description} · en otra moneda, no se descuenta acá
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(
                      expense.amount,
                      expense.currency ?? settlement.currency
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Ajustes">
          {settlement.adjustments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin retenciones ni adelantos.
            </p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {settlement.adjustments.map((adjustment) => (
                <li
                  key={adjustment.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0">
                    <p
                      className={
                        adjustment.voidedAt ? "line-through" : "font-medium"
                      }
                    >
                      {adjustment.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ADJUSTMENT_CONCEPT_LABELS[adjustment.concept]}
                      {adjustment.createdBy &&
                        ` · ${adjustment.createdBy.fullName}`}
                      {adjustment.voidedAt &&
                        ` · anulado: ${adjustment.voidReason ?? ""}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">
                      {adjustmentSubtracts(adjustment.concept) ? "−" : "+"}
                      {money(adjustment.amount)}
                    </span>
                    {pending && !adjustment.voidedAt && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Anular ${adjustment.description}`}
                        onClick={() =>
                          open({ kind: "void-adjustment", adjustment })
                        }
                      >
                        <Ban aria-hidden />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Transferencias al propietario"
          className="md:col-span-2"
        >
          {settlement.transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {canTransfer
                ? `Falta transferir ${money(settlement.netAmount)}.`
                : "Todavía no hay transferencias."}
            </p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {settlement.transfers.map((transfer) => (
                <li
                  key={transfer.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div>
                    <p
                      className={
                        transfer.voidedAt ? "line-through" : "font-medium"
                      }
                    >
                      {money(transfer.amount)} ·{" "}
                      {formatDate(transfer.transferredAt)} ·{" "}
                      {PAYMENT_METHOD_LABELS[transfer.method]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transfer.registeredBy?.fullName}
                      {transfer.notes && ` · ${transfer.notes}`}
                      {transfer.voidedAt && " · anulada"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {transfer.receiptUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={transfer.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink aria-hidden />
                          Comprobante
                        </a>
                      </Button>
                    )}
                    {isAdmin && !transfer.voidedAt && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Anular transferencia del ${formatDate(transfer.transferredAt)}`}
                        onClick={() =>
                          open({ kind: "void-transfer", transfer })
                        }
                      >
                        <Ban aria-hidden />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {dialog?.kind === "adjustment" && (
        <AdjustmentDialog
          key={dialogKey}
          settlement={settlement}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "transfer" && (
        <TransferDialog
          key={dialogKey}
          settlement={settlement}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "cancel" && (
        <ReasonDialog
          key={dialogKey}
          title="¿Cancelar la liquidación?"
          description="Los pagos y gastos vuelven a quedar disponibles para otra liquidación. Queda registrado el motivo."
          confirmLabel="Cancelar liquidación"
          successMessage="Liquidación cancelada."
          errorMessage="No se pudo cancelar."
          onConfirm={(reason) =>
            cancel.mutateAsync({ id: settlement.id, reason })
          }
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "void-adjustment" && (
        <ReasonDialog
          key={dialogKey}
          title="¿Anular el ajuste?"
          description={`"${dialog.adjustment.description}" deja de afectar el neto.`}
          confirmLabel="Anular ajuste"
          successMessage="Ajuste anulado."
          errorMessage="No se pudo anular el ajuste."
          onConfirm={(reason) =>
            voidAdjustment.mutateAsync({ id: dialog.adjustment.id, reason })
          }
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "void-transfer" && (
        <ReasonDialog
          key={dialogKey}
          title="¿Anular la transferencia?"
          description={`La transferencia de ${money(dialog.transfer.amount)} del ${formatDate(
            dialog.transfer.transferredAt
          )} deja de contar; la liquidación vuelve a confirmada si falta transferir.`}
          confirmLabel="Anular transferencia"
          successMessage="Transferencia anulada."
          errorMessage="No se pudo anular la transferencia."
          onConfirm={(reason) =>
            voidTransfer.mutateAsync({ id: dialog.transfer.id, reason })
          }
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
    </div>
  )
}

function Row({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`text-right tabular-nums ${muted ? "text-muted-foreground" : ""}`}
      >
        {value}
      </dd>
    </>
  )
}

function Section({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  const id = React.useId()
  return (
    <section
      aria-labelledby={id}
      className={`rounded-xl border bg-card p-4 ${className ?? ""}`}
    >
      <h2 id={id} className="mb-3 font-display text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  )
}
