"use client"

import * as React from "react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  InstallmentDetail,
  LateFeeAdjustmentKind,
} from "@adminprop/shared-types"
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
import { Label } from "@adminprop/ui/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@adminprop/ui/components/radio-group"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"
import { Textarea } from "@adminprop/ui/components/textarea"

import { useAdjustLateFee } from "@/lib/billing-api"
import { formatMoney, normalizeAmount } from "@/lib/contracts"

/**
 * Reducir o condonar el punitorio (Micaela #3 y #4), sólo admin. Queda el
 * ajuste con motivo, usuario y fecha; condonar además frena el devengo.
 */
export function LateFeeAdjustmentDialog({
  installment,
  open,
  onOpenChange,
}: {
  installment: Pick<
    InstallmentDetail,
    "id" | "currency" | "lateFeeAccrued" | "lateFeeBalance"
  >
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const adjust = useAdjustLateFee()
  const [kind, setKind] = React.useState<LateFeeAdjustmentKind>("REDUCE")
  const [amount, setAmount] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [errors, setErrors] = React.useState<{
    amount?: string
    reason?: string
    general?: string
  }>({})
  const money = (value: string) => formatMoney(value, installment.currency)

  async function submit() {
    const next: typeof errors = {}
    if (kind === "REDUCE" && normalizeAmount(amount) === null) {
      next.amount = "Ingresá cuánto se reduce."
    }
    if (reason.trim().length < 3) next.reason = "Contá el motivo."
    setErrors(next)
    if (Object.keys(next).length > 0) return
    try {
      await adjust.mutateAsync({
        installmentId: installment.id,
        kind,
        amount: kind === "REDUCE" ? normalizeAmount(amount)! : undefined,
        reason: reason.trim(),
      })
      toast.success(
        kind === "WAIVE" ? "Punitorio condonado." : "Punitorio reducido."
      )
      onOpenChange(false)
    } catch (cause) {
      setErrors({
        general: apiErrorMessage(cause, "No se pudo ajustar el punitorio."),
      })
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Ajustar punitorio</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Devengado hasta hoy: {money(installment.lateFeeAccrued)}. Pendiente
            de cobro: {money(installment.lateFeeBalance)}. El ajuste queda
            registrado con tu usuario.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 sm:px-0">
          <FieldGroup>
            <RadioGroup
              value={kind}
              onValueChange={(value) => setKind(value as LateFeeAdjustmentKind)}
              aria-label="Tipo de ajuste"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="REDUCE" id="adjust-reduce" />
                <Label htmlFor="adjust-reduce">Reducir un monto</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="WAIVE" id="adjust-waive" />
                <Label htmlFor="adjust-waive">
                  Condonar todo (deja de correr el punitorio)
                </Label>
              </div>
            </RadioGroup>
            {kind === "REDUCE" && (
              <Field data-invalid={errors.amount !== undefined}>
                <FieldLabel htmlFor="adjust-amount">Monto a reducir</FieldLabel>
                <Input
                  id="adjust-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  aria-invalid={errors.amount !== undefined}
                />
                {errors.amount ? (
                  <FieldError errors={[{ message: errors.amount }]} />
                ) : (
                  normalizeAmount(amount) && (
                    <FieldDescription>
                      {money(normalizeAmount(amount)!)}
                    </FieldDescription>
                  )
                )}
              </Field>
            )}
            <Field data-invalid={errors.reason !== undefined}>
              <FieldLabel htmlFor="adjust-reason">Motivo</FieldLabel>
              <Textarea
                id="adjust-reason"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                aria-invalid={errors.reason !== undefined}
              />
              {errors.reason && (
                <FieldError errors={[{ message: errors.reason }]} />
              )}
            </Field>
          </FieldGroup>
          {errors.general && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={adjust.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={adjust.isPending}>
            {kind === "WAIVE" ? "Condonar" : "Reducir"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
