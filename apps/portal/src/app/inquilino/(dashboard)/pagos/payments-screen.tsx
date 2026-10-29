"use client"

import * as React from "react"
import { ChevronRight, FileDown } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { InstallmentSummary } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"

import {
  formatDate,
  formatMoney,
  INSTALLMENT_STATUS_META,
  isZero,
  PAYMENT_METHOD_LABELS,
  periodLabel,
} from "@/lib/format"
import {
  renterReceiptUrl,
  useRenterInstallment,
  useRenterInstallments,
} from "@/lib/portal-api"

/** Historial de cuotas y pagos del inquilino (PRD 15.2), con el recibo de cada pago. */
export function RenterPaymentsScreen() {
  const query = useRenterInstallments()
  const [selected, setSelected] = React.useState<string | null>(null)
  const installments = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Pagos
        </h1>
        <p className="text-sm text-muted-foreground">
          Tus cuotas, mes a mes, y lo que pagaste de cada una.
        </p>
      </div>
      {query.isPending ? (
        <PageSkeleton cards={3} />
      ) : query.isError ? (
        <EmptyState
          title="No pudimos cargar tus pagos"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : installments.length === 0 ? (
        <EmptyState
          title="Todavía no hay cuotas"
          description="Cuando la inmobiliaria genere la primera, la vas a ver acá."
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {installments.map((installment) => (
              <li key={installment.id}>
                <InstallmentRow
                  installment={installment}
                  onOpen={() => setSelected(installment.id)}
                />
              </li>
            ))}
          </ul>
          {query.hasNextPage && (
            <Button
              variant="outline"
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              Ver más
            </Button>
          )}
        </>
      )}
      {selected && (
        <InstallmentDialog id={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function InstallmentRow({
  installment,
  onOpen,
}: {
  installment: InstallmentSummary
  onOpen: () => void
}) {
  const meta = INSTALLMENT_STATUS_META[installment.status]
  const money = (amount: string) => formatMoney(amount, installment.currency)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="min-w-0">
        <p className="font-medium capitalize">
          {periodLabel(installment.period)}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {money(installment.baseAmount)}
          {!isZero(installment.lateFeeAccrued) &&
            ` + punitorio ${money(installment.lateFeeAccrued)}`}
          {installment.status !== "PAID" &&
            ` · falta ${money(installment.totalDue)}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={meta.badge}>{meta.label}</Badge>
        <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
      </div>
    </button>
  )
}

function InstallmentDialog({
  id,
  onClose,
}: {
  id: string
  onClose: () => void
}) {
  const query = useRenterInstallment(id)
  const installment = query.data
  const money = (amount: string) =>
    formatMoney(amount, installment?.currency ?? "ARS")

  return (
    <ResponsiveDialog open onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="capitalize">
            {installment
              ? `Cuota de ${periodLabel(installment.period)}`
              : "Cuota"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {installment
              ? installment.status === "PAID"
                ? "Pagada. Estos son los pagos registrados."
                : `Saldo: ${money(installment.totalDue)}.`
              : "Cargando…"}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 pb-4 sm:px-0">
          {query.isError && (
            <p className="text-sm text-destructive">
              {apiErrorMessage(query.error, "No pudimos cargar la cuota.")}
            </p>
          )}
          {installment &&
            installment.payments.filter((p) => p.status !== "VOIDED").length ===
              0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no hay pagos registrados.
              </p>
            )}
          {installment && (
            <ul className="flex flex-col divide-y text-sm">
              {installment.payments
                .filter((payment) => payment.status !== "VOIDED")
                .map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <div>
                      <p className="font-medium tabular-nums">
                        {formatMoney(payment.amount, payment.paidCurrency)}
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {formatDate(payment.paidAt)} ·{" "}
                          {PAYMENT_METHOD_LABELS[payment.method]}
                        </span>
                      </p>
                      {payment.exchangeRate && (
                        <p className="text-xs text-muted-foreground">
                          Cotización {formatMoney(payment.exchangeRate, "ARS")}{" "}
                          por dólar = {money(payment.amountInContractCurrency)}
                        </p>
                      )}
                      {payment.status === "PENDING_CONFIRMATION" && (
                        <p className="text-xs text-muted-foreground">
                          Informado, pendiente de confirmar.
                        </p>
                      )}
                    </div>
                    {payment.kind === "CASH_IN" &&
                      payment.status === "CONFIRMED" && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={renterReceiptUrl(payment.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileDown aria-hidden />
                            Recibo
                          </a>
                        </Button>
                      )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
