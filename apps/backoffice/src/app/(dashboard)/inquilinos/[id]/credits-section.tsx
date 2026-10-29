"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type { PaymentMethod, RenterCredit } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import { Skeleton } from "@adminprop/ui/components/skeleton"
import { Textarea } from "@adminprop/ui/components/textarea"

import { ArrearsBadge } from "@/components/arrears-badge"
import {
  CASH_PAYMENT_METHODS,
  CREDIT_STATUS_META,
  formatMoneyList,
  PAYMENT_METHOD_LABELS,
} from "@/lib/billing"
import {
  useRefundCredit,
  useRenterArrears,
  useRenterCredits,
} from "@/lib/billing-api"
import { formatMoney } from "@/lib/contracts"
import { formatDate, todayIso } from "@/lib/dates"

/**
 * "Pagos y saldos" de la ficha del inquilino (spec 5.2 y Micaela #6): mora
 * con punitorio, saldo a favor disponible y su historial; devolver (admin).
 */
export function RenterBillingSection({ renterId }: { renterId: string }) {
  const { user } = useSession()
  const arrears = useRenterArrears(renterId)
  const credits = useRenterCredits(renterId)
  const [refunding, setRefunding] = React.useState<RenterCredit | null>(null)
  const isAdmin = user?.role === "ADMIN"

  return (
    <section
      className="rounded-xl border bg-card p-4 md:col-span-2"
      aria-labelledby="renter-billing-title"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="renter-billing-title"
          className="font-display text-lg font-semibold"
        >
          Pagos y saldos
        </h2>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/cobros?renterId=${renterId}`}>Ver cuotas</Link>
        </Button>
      </div>
      {arrears.isPending || credits.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-10" />
        </div>
      ) : arrears.isError || credits.isError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(
            arrears.error ?? credits.error,
            "No se pudo cargar el estado de pago."
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <ArrearsBadge arrears={arrears.data} withAmount />
            {arrears.data && arrears.data.overdueInstallments > 0 && (
              <span className="text-muted-foreground">
                {arrears.data.overdueInstallments}{" "}
                {arrears.data.overdueInstallments === 1
                  ? "cuota vencida"
                  : "cuotas vencidas"}{" "}
                · debe {formatMoneyList(arrears.data.balance)}
              </span>
            )}
          </div>
          <p>
            <span className="text-muted-foreground">
              Saldo a favor disponible:{" "}
            </span>
            <span className="font-medium tabular-nums">
              {formatMoneyList(
                credits.data.totals.map((t) => ({
                  currency: t.currency,
                  amount: t.available,
                }))
              )}
            </span>
          </p>
          {credits.data.credits.length > 0 && (
            <ul className="flex flex-col divide-y">
              {credits.data.credits.map((credit) => {
                const meta = CREDIT_STATUS_META[credit.status]
                return (
                  <li
                    key={credit.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <div>
                      <p className="font-medium tabular-nums">
                        {formatMoney(credit.remaining, credit.currency)}
                        {credit.remaining !== credit.amount && (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            de {formatMoney(credit.amount, credit.currency)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Generado el {formatDate(credit.createdAt.slice(0, 10))}
                        {credit.refundedAt &&
                          ` · devuelto el ${formatDate(credit.refundedAt)}${
                            credit.refundMethod
                              ? ` por ${PAYMENT_METHOD_LABELS[credit.refundMethod].toLowerCase()}`
                              : ""
                          }`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={meta.badge}>{meta.label}</Badge>
                      {isAdmin && credit.status === "AVAILABLE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRefunding(credit)}
                        >
                          Devolver
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
      {refunding && (
        <RefundDialog
          key={refunding.id}
          credit={refunding}
          open
          onOpenChange={(open) => !open && setRefunding(null)}
        />
      )}
    </section>
  )
}

/** Devolución de un saldo a favor (Micaela #6), con fecha y medio. Sólo admin. */
function RefundDialog({
  credit,
  open,
  onOpenChange,
}: {
  credit: RenterCredit
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const refund = useRefundCredit()
  const [refundedAt, setRefundedAt] = React.useState(todayIso())
  const [method, setMethod] = React.useState<PaymentMethod>("TRANSFER")
  const [notes, setNotes] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  async function confirm() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(refundedAt)) {
      setError("Ingresá la fecha de la devolución.")
      return
    }
    try {
      await refund.mutateAsync({
        id: credit.id,
        refundedAt,
        method,
        notes: notes.trim() || undefined,
      })
      toast.success("Devolución registrada.")
      onOpenChange(false)
    } catch (cause) {
      setError(apiErrorMessage(cause, "No se pudo registrar la devolución."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Devolver saldo a favor</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Se devuelven {formatMoney(credit.remaining, credit.currency)} al
            inquilino y el saldo deja de estar disponible.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 sm:px-0">
          <FieldGroup>
            <Field data-invalid={error !== null}>
              <FieldLabel htmlFor="refund-date">Fecha</FieldLabel>
              <Input
                id="refund-date"
                type="date"
                value={refundedAt}
                onChange={(event) => setRefundedAt(event.target.value)}
              />
              {error && <FieldError errors={[{ message: error }]} />}
            </Field>
            <Field>
              <FieldLabel htmlFor="refund-method">Medio</FieldLabel>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as PaymentMethod)}
              >
                <SelectTrigger id="refund-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CASH_PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="refund-notes">Observaciones</FieldLabel>
              <Textarea
                id="refund-notes"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>
          </FieldGroup>
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={refund.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void confirm()} disabled={refund.isPending}>
            Registrar devolución
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
