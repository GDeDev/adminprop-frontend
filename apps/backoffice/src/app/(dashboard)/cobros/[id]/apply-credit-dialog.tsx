"use client"

import * as React from "react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { InstallmentDetail } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldDescription,
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

import { useApplyCredit } from "@/lib/billing-api"
import { formatMoney, normalizeAmount } from "@/lib/contracts"

/**
 * Aplicar saldo a favor sin plata nueva (A-6, aplicación manual). Sin monto
 * se usa todo lo disponible hasta cubrir el saldo; los créditos se consumen
 * del más viejo al más nuevo.
 */
export function ApplyCreditDialog({
  installment,
  open,
  onOpenChange,
}: {
  installment: Pick<
    InstallmentDetail,
    "id" | "currency" | "creditsAvailable" | "totalDue"
  >
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const apply = useApplyCredit()
  const [amount, setAmount] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const money = (value: string) => formatMoney(value, installment.currency)

  async function submit() {
    setError(null)
    if (amount.trim() !== "" && normalizeAmount(amount) === null) {
      setError("El monto no es válido.")
      return
    }
    try {
      await apply.mutateAsync({
        installmentId: installment.id,
        amount: amount.trim() === "" ? undefined : normalizeAmount(amount)!,
      })
      toast.success("Saldo a favor aplicado.")
      onOpenChange(false)
    } catch (cause) {
      setError(apiErrorMessage(cause, "No se pudo aplicar el saldo a favor."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Aplicar saldo a favor</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            El inquilino tiene {money(installment.creditsAvailable)} a favor; la
            cuota debe {money(installment.totalDue)}.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 sm:px-0">
          <FieldGroup>
            <Field data-invalid={error !== null}>
              <FieldLabel htmlFor="credit-amount">Monto (opcional)</FieldLabel>
              <Input
                id="credit-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={error !== null}
              />
              {error ? (
                <FieldError errors={[{ message: error }]} />
              ) : (
                <FieldDescription>
                  Vacío: se aplica todo lo que haga falta.
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
          {error && amount.trim() === "" && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={apply.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={apply.isPending}>
            Aplicar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
