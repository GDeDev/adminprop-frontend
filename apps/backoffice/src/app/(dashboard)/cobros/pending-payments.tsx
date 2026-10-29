"use client"

import Link from "next/link"
import { CheckCircle2, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { PaymentListItem } from "@adminprop/shared-types"
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

import { LoadMore } from "@/components/load-more"
import {
  exchangeRateLabel,
  PAYMENT_METHOD_LABELS,
  periodLabel,
} from "@/lib/billing"
import { useConfirmPayment, useInfinitePayments } from "@/lib/billing-api"
import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"

/**
 * Pagos informados por el propietario que esperan confirmación (Micaela 9B):
 * cuentan para los saldos desde su fecha (A-11); confirmarlos es control.
 */
export function PendingPayments() {
  const query = useInfinitePayments({ status: "PENDING_CONFIRMATION" })
  const confirm = useConfirmPayment()
  const payments = query.data?.pages.flatMap((page) => page.data) ?? []

  async function confirmPayment(payment: PaymentListItem) {
    try {
      await confirm.mutateAsync(payment.id)
      toast.success("Pago confirmado.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo confirmar el pago."))
    }
  }

  if (query.isPending) return <PageSkeleton cards={2} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudieron cargar los pagos"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        }
      />
    )
  }
  if (payments.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No hay pagos por confirmar"
        description="Acá aparecen los pagos que cobró el propietario y se cargaron como informados."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3 md:hidden">
        {payments.map((payment) => (
          <li
            key={payment.id}
            className="rounded-xl border bg-card p-4 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/cobros/${payment.installmentId}`}
                  className="font-medium hover:underline"
                >
                  {payment.renter?.fullName ?? "Sin inquilino"}
                </Link>
                <p className="text-muted-foreground">
                  {payment.property?.address ?? "Propiedad eliminada"} · cuota{" "}
                  {periodLabel(payment.period)}
                </p>
              </div>
              <span className="font-display font-medium tabular-nums">
                {formatMoney(payment.amount, payment.paidCurrency)}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">
              {formatDate(payment.paidAt)} ·{" "}
              {PAYMENT_METHOD_LABELS[payment.method]}
              {exchangeRateLabel(payment, formatDate) &&
                ` · ${exchangeRateLabel(payment, formatDate)}`}
            </p>
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                onClick={() => void confirmPayment(payment)}
                disabled={confirm.isPending}
              >
                Confirmar
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Inquilino</TableHead>
              <TableHead>Propiedad</TableHead>
              <TableHead>Cuota</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Medio</TableHead>
              <TableHead className="w-0">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {payment.renter?.fullName ?? "Sin inquilino"}
                </TableCell>
                <TableCell>
                  {payment.property?.address ?? "Propiedad eliminada"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/cobros/${payment.installmentId}`}
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    {periodLabel(payment.period)}
                    <ExternalLink aria-hidden className="size-3" />
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatDate(payment.paidAt)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(payment.amount, payment.paidCurrency)}
                  {exchangeRateLabel(payment, formatDate) && (
                    <p className="text-xs text-muted-foreground">
                      {exchangeRateLabel(payment, formatDate)}
                    </p>
                  )}
                </TableCell>
                <TableCell>{PAYMENT_METHOD_LABELS[payment.method]}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => void confirmPayment(payment)}
                    disabled={confirm.isPending}
                  >
                    Confirmar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <LoadMore
        hasMore={query.hasNextPage}
        loading={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
      />
    </div>
  )
}
