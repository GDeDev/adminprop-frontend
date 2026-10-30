"use client"

import * as React from "react"
import Link from "next/link"
import {
  Ban,
  ChevronLeft,
  CircleDollarSign,
  ExternalLink,
  PiggyBank,
  Plus,
  Scale,
} from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type {
  InstallmentCharge,
  InstallmentDetail,
  Payment,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"

import {
  CHARGE_CONCEPT_LABELS,
  COLLECTION_MODE_LABELS,
  daysLabel,
  exchangeRateLabel,
  FEE_MODE_LABELS,
  isZero,
  LATE_FEE_ADJUSTMENT_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_RECEIVER_LABELS,
  PAYMENT_STATUS_META,
  periodLabel,
} from "@/lib/billing"
import {
  useConfirmPayment,
  useInstallment,
  useVoidCharge,
  useVoidPayment,
} from "@/lib/billing-api"
import { formatMoney } from "@/lib/contracts"
import { addDays, formatDate } from "@/lib/dates"

import { InstallmentBadges } from "../billing-screen"
import { ApplyCreditDialog } from "./apply-credit-dialog"
import { ChargeDialog } from "./charge-dialog"
import { LateFeeAdjustmentDialog } from "./late-fee-adjustment-dialog"
import { ReasonDialog } from "./reason-dialog"
import { RegisterPaymentDialog } from "./register-payment-dialog"

type DialogState =
  | { kind: "payment" }
  | { kind: "charge" }
  | { kind: "late-fee" }
  | { kind: "credit" }
  | { kind: "void-payment"; payment: Payment }
  | { kind: "void-charge"; charge: InstallmentCharge }
  | null

/** Ficha de la cuota (rediseño, sección 7): desglose, pagos, cargos y ajustes. */
export function InstallmentDetailScreen({ id }: { id: string }) {
  const query = useInstallment(id)
  if (query.isPending) return <PageSkeleton cards={3} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar la cuota"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button variant="outline" asChild>
            <Link href="/cobros">Volver a cobros</Link>
          </Button>
        }
      />
    )
  }
  return <Detail installment={query.data} />
}

function Detail({ installment }: { installment: InstallmentDetail }) {
  const { user } = useSession()
  const isAdmin = user?.role === "ADMIN"
  const [dialog, setDialog] = React.useState<DialogState>(null)
  const [dialogKey, setDialogKey] = React.useState(0)
  const confirm = useConfirmPayment()
  const voidPayment = useVoidPayment()
  const voidCharge = useVoidCharge()
  const money = (amount: string) => formatMoney(amount, installment.currency)
  const owes = !isZero(installment.totalDue)
  const hasCredit = !isZero(installment.creditsAvailable)
  const canAdjustLateFee =
    isAdmin && !installment.lateFeeWaived && !isZero(installment.lateFeeAccrued)

  function open(state: DialogState) {
    setDialogKey((k) => k + 1)
    setDialog(state)
  }

  async function confirmPayment(payment: Payment) {
    try {
      await confirm.mutateAsync(payment.id)
      toast.success("Pago confirmado.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo confirmar el pago."))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/cobros"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Cobros
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Cuota de {periodLabel(installment.period)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {installment.renter ? (
                <Link
                  href={`/inquilinos/${installment.renter.id}`}
                  className="hover:underline"
                >
                  {installment.renter.fullName}
                </Link>
              ) : (
                "Sin inquilino"
              )}
              {" · "}
              {installment.property ? (
                <Link
                  href={`/propiedades/${installment.property.id}`}
                  className="hover:underline"
                >
                  {installment.property.address}
                </Link>
              ) : (
                "Propiedad eliminada"
              )}
              {" · "}
              <Link
                href={`/contratos/${installment.contract.id}`}
                className="hover:underline"
              >
                Ver contrato
              </Link>
            </p>
            <div className="mt-2">
              <InstallmentBadges installment={installment} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => open({ kind: "payment" })}>
              <CircleDollarSign aria-hidden />
              Registrar pago
            </Button>
            {owes && hasCredit && (
              <Button
                variant="outline"
                onClick={() => open({ kind: "credit" })}
              >
                <PiggyBank aria-hidden />
                Aplicar saldo a favor
              </Button>
            )}
            {installment.status !== "PAID" && (
              <Button
                variant="outline"
                onClick={() => open({ kind: "charge" })}
              >
                <Plus aria-hidden />
                Agregar cargo
              </Button>
            )}
            {canAdjustLateFee && (
              <Button
                variant="outline"
                onClick={() => open({ kind: "late-fee" })}
              >
                <Scale aria-hidden />
                Ajustar punitorio
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Breakdown installment={installment} />
        <Section title="Términos de cobro">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Quién cobra</dt>
            <dd>{COLLECTION_MODE_LABELS[installment.collectionMode]}</dd>
            <dt className="text-muted-foreground">Honorarios</dt>
            <dd>
              {installment.feeAmount
                ? `${money(installment.feeAmount)} fijos`
                : `${installment.feePercentage} % del alquiler`}
              <p className="text-xs text-muted-foreground">
                {FEE_MODE_LABELS[installment.feeMode]}
              </p>
            </dd>
            <dt className="text-muted-foreground">Devengados</dt>
            <dd className="tabular-nums">
              {money(installment.feeOnCollected)} sobre lo cobrado
              <p className="text-xs text-muted-foreground">
                {money(installment.feeOnBase)} sobre el alquiler completo
              </p>
            </dd>
            <dt className="text-muted-foreground">Punitorio</dt>
            <dd>
              {installment.lateFeePercentage} % diario desde el{" "}
              <span className="tabular-nums">
                {formatDate(addDays(installment.graceEndDate, 1))}
              </span>
              <p className="text-xs text-muted-foreground">
                {installment.lateFeeGraceDays} días de gracia
              </p>
            </dd>
            {installment.notes && (
              <>
                <dt className="text-muted-foreground">Notas</dt>
                <dd>{installment.notes}</dd>
              </>
            )}
          </dl>
        </Section>

        <Section title="Pagos" className="md:col-span-2">
          {installment.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay pagos registrados.
            </p>
          ) : (
            <PaymentRows
              installment={installment}
              onConfirm={(payment) => void confirmPayment(payment)}
              onVoid={(payment) => open({ kind: "void-payment", payment })}
              canVoid={isAdmin}
              confirming={confirm.isPending}
            />
          )}
        </Section>

        <Section title="Cargos">
          {installment.charges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin cargos: la cuota es sólo el alquiler.
            </p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {installment.charges.map((charge) => (
                <li
                  key={charge.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0">
                    <p
                      className={
                        charge.voidedAt ? "line-through" : "font-medium"
                      }
                    >
                      {charge.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {CHARGE_CONCEPT_LABELS[charge.concept]} ·{" "}
                      {formatDate(charge.createdAt.slice(0, 10))}
                      {charge.createdBy && ` · ${charge.createdBy.fullName}`}
                      {charge.voidedAt &&
                        ` · Anulado: ${charge.voidReason ?? ""}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">
                      {money(charge.amount)}
                    </span>
                    {!charge.voidedAt && installment.status !== "PAID" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Anular ${charge.description}`}
                        onClick={() => open({ kind: "void-charge", charge })}
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

        <Section title="Ajustes de punitorio">
          {installment.lateFeeAdjustments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin ajustes.</p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {installment.lateFeeAdjustments.map((adjustment) => (
                <li
                  key={adjustment.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {LATE_FEE_ADJUSTMENT_LABELS[adjustment.kind]} ·{" "}
                      {adjustment.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(adjustment.createdAt.slice(0, 10))}
                      {adjustment.createdBy &&
                        ` · ${adjustment.createdBy.fullName}`}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums">
                    −{money(adjustment.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {dialog?.kind === "payment" && (
        <RegisterPaymentDialog
          key={dialogKey}
          installment={installment}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "charge" && (
        <ChargeDialog
          key={dialogKey}
          installment={installment}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "late-fee" && (
        <LateFeeAdjustmentDialog
          key={dialogKey}
          installment={installment}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "credit" && (
        <ApplyCreditDialog
          key={dialogKey}
          installment={installment}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "void-payment" && (
        <ReasonDialog
          key={dialogKey}
          title="¿Anular el pago?"
          description={`El pago de ${formatMoney(
            dialog.payment.amount,
            dialog.payment.paidCurrency
          )} del ${formatDate(
            dialog.payment.paidAt
          )} deja de contar; la cuota vuelve a deber y el punitorio se recalcula. Queda registrado.`}
          confirmLabel="Anular pago"
          successMessage="Pago anulado."
          errorMessage="No se pudo anular el pago."
          onConfirm={(reason) =>
            voidPayment.mutateAsync({ id: dialog.payment.id, reason })
          }
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "void-charge" && (
        <ReasonDialog
          key={dialogKey}
          title="¿Anular el cargo?"
          description={`"${dialog.charge.description}" por ${money(
            dialog.charge.amount
          )} deja de sumar a la cuota. Sólo se puede si todavía no se le imputó ningún pago.`}
          confirmLabel="Anular cargo"
          successMessage="Cargo anulado."
          errorMessage="No se pudo anular el cargo."
          onConfirm={(reason) =>
            voidCharge.mutateAsync({ id: dialog.charge.id, reason })
          }
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
    </div>
  )
}

/** Spec 3.4 y Micaela #4: total arriba, día por día desplegable. */
function Breakdown({ installment }: { installment: InstallmentDetail }) {
  const money = (amount: string) => formatMoney(amount, installment.currency)
  return (
    <Section title="Desglose">
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Alquiler</dt>
        <dd className="text-right tabular-nums">
          {money(installment.baseAmount)}
        </dd>
        <dt className="text-muted-foreground">Cargos</dt>
        <dd className="text-right tabular-nums">
          {money(installment.chargesTotal)}
        </dd>
        <dt className="text-muted-foreground">
          Punitorio devengado
          {installment.feeDays > 0 && ` (${daysLabel(installment.feeDays)})`}
        </dt>
        <dd className="text-right tabular-nums">
          {money(installment.lateFeeAccrued)}
        </dd>
        {!isZero(installment.lateFeeAdjusted) && (
          <>
            <dt className="text-muted-foreground">Ajustes de punitorio</dt>
            <dd className="text-right tabular-nums">
              −{money(installment.lateFeeAdjusted)}
            </dd>
          </>
        )}
        <dt className="text-muted-foreground">Pagado</dt>
        <dd className="text-right tabular-nums">
          −{money(installment.paidTotal)}
        </dd>
        <dt className="border-t pt-2 font-medium">Saldo</dt>
        <dd className="border-t pt-2 text-right font-display text-xl font-semibold tabular-nums">
          {money(installment.totalDue)}
        </dd>
      </dl>
      <p className="mt-2 text-xs text-muted-foreground tabular-nums">
        Alquiler {money(installment.rentBalance)} · punitorio{" "}
        {money(installment.lateFeeBalance)} · cargos{" "}
        {money(installment.chargesBalance)}
        {!isZero(installment.pendingConfirmationTotal) &&
          ` · ${money(installment.pendingConfirmationTotal)} informados sin confirmar`}
        {!isZero(installment.creditsAvailable) &&
          ` · saldo a favor disponible ${money(installment.creditsAvailable)}`}
      </p>
      {installment.lateFeeDays.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">
            Ver el punitorio día por día
          </summary>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead>Día</TableHead>
                <TableHead className="text-right">Alquiler impago</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Punitorio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installment.lateFeeDays.map((day) => (
                <TableRow key={day.dayNumber}>
                  <TableCell className="tabular-nums">
                    {day.dayNumber} · {formatDate(day.day)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(day.outstandingBase)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {day.dailyPercentage} %
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(day.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </details>
      )}
    </Section>
  )
}

function PaymentRows({
  installment,
  onConfirm,
  onVoid,
  canVoid,
  confirming,
}: {
  installment: InstallmentDetail
  onConfirm: (payment: Payment) => void
  onVoid: (payment: Payment) => void
  canVoid: boolean
  confirming: boolean
}) {
  const money = (amount: string) => formatMoney(amount, installment.currency)
  return (
    <ul className="flex flex-col divide-y text-sm">
      {installment.payments.map((payment) => {
        const status = PAYMENT_STATUS_META[payment.status]
        const foreign = payment.paidCurrency !== installment.currency
        const rate = exchangeRateLabel(payment, formatDate)
        return (
          <li key={payment.id} className="flex flex-col gap-1 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium tabular-nums">
                  {formatMoney(payment.amount, payment.paidCurrency)}
                  {foreign && ` = ${money(payment.amountInContractCurrency)}`}
                  <span className="font-normal text-muted-foreground">
                    {" · "}
                    {formatDate(payment.paidAt)} ·{" "}
                    {PAYMENT_METHOD_LABELS[payment.method]}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {payment.kind === "CREDIT_APPLICATION"
                    ? "Aplicación de saldo a favor"
                    : PAYMENT_RECEIVER_LABELS[payment.receivedBy]}
                  {rate && ` · ${rate}`}
                  {payment.registeredBy &&
                    ` · ${payment.registeredBy.fullName}`}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Imputado: punitorio {money(payment.lateFeeApplied)} · alquiler{" "}
                  {money(payment.rentApplied)} · cargos{" "}
                  {money(payment.chargesApplied)}
                  {!isZero(payment.creditGenerated) &&
                    ` · a favor ${money(payment.creditGenerated)}`}
                </p>
                {payment.notes && (
                  <p className="text-xs text-muted-foreground">
                    {payment.notes}
                  </p>
                )}
                {payment.settlementId && (
                  <p className="text-xs text-muted-foreground">
                    Liquidado al propietario:{" "}
                    <Link
                      href={`/liquidaciones/${payment.settlementId}`}
                      className="underline"
                    >
                      ver liquidación
                    </Link>
                  </p>
                )}
                {payment.voidedAt && (
                  <p className="text-xs text-destructive">
                    Anulado el {formatDate(payment.voidedAt.slice(0, 10))}
                    {payment.voidReason && `: ${payment.voidReason}`}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={status.badge}>{status.label}</Badge>
                {payment.receiptUrl && (
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink aria-hidden />
                      Comprobante
                    </a>
                  </Button>
                )}
                {payment.status === "PENDING_CONFIRMATION" && (
                  <Button
                    size="sm"
                    onClick={() => onConfirm(payment)}
                    disabled={confirming}
                  >
                    Confirmar
                  </Button>
                )}
                {canVoid && payment.status !== "VOIDED" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Anular pago del ${formatDate(payment.paidAt)}`}
                    onClick={() => onVoid(payment)}
                  >
                    <Ban aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
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
