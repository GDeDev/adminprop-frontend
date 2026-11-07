"use client"

import * as React from "react"
import { toast } from "sonner"

import { apiErrorCode, apiErrorMessage } from "@adminprop/session/client"
import type { PaymentMethod, SettlementDetail } from "@adminprop/shared-types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import { Textarea } from "@adminprop/ui/components/textarea"

import { CASH_PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/billing"
import { formatMoney, normalizeAmount } from "@/lib/contracts"
import { todayIso } from "@/lib/dates"
import { RECEIPT_ACCEPT, receiptProblem } from "@/lib/services"
import { useRegisterTransfer } from "@/lib/settlements-api"

/** Transferencia al propietario (Micaela 9A): fecha, medio, importe y comprobante; puede ser parcial. */
export function TransferDialog({
  settlement,
  open,
  onOpenChange,
}: {
  settlement: Pick<
    SettlementDetail,
    "id" | "currency" | "netAmount" | "transferredTotal"
  >
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const register = useRegisterTransfer()
  const [transferredAt, setTransferredAt] = React.useState(todayIso())
  const [amount, setAmount] = React.useState("")
  const [method, setMethod] = React.useState<PaymentMethod>("TRANSFER")
  const [notes, setNotes] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [errors, setErrors] = React.useState<{
    amount?: string
    file?: string
    general?: string
  }>({})
  const money = (value: string) => formatMoney(value, settlement.currency)

  async function confirm() {
    const next: typeof errors = {}
    if (normalizeAmount(amount) === null)
      next.amount = "Ingresá el importe transferido."
    if (file) {
      const problem = receiptProblem(file)
      if (problem) next.file = problem
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return
    try {
      await register.mutateAsync({
        settlementId: settlement.id,
        transferredAt,
        amount: normalizeAmount(amount)!,
        method,
        notes: notes.trim() || undefined,
        file,
      })
      toast.success("Transferencia registrada.")
      onOpenChange(false)
    } catch (cause) {
      if (apiErrorCode(cause) === "SETTLEMENT_TRANSFER_EXCEEDS_NET") {
        setErrors({ amount: "Supera lo que falta transferir." })
        return
      }
      setErrors({
        general: apiErrorMessage(
          cause,
          "No se pudo registrar la transferencia."
        ),
      })
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Registrar transferencia</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Neto {money(settlement.netAmount)}; ya transferido{" "}
            {money(settlement.transferredTotal)}. Puede ser en partes.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 sm:px-0">
          <FieldGroup>
            <Field data-invalid={errors.amount !== undefined}>
              <FieldLabel htmlFor="transfer-amount">Importe</FieldLabel>
              <Input
                id="transfer-amount"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="transfer-date">Fecha</FieldLabel>
                <Input
                  id="transfer-date"
                  type="date"
                  value={transferredAt}
                  onChange={(event) => setTransferredAt(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="transfer-method">Medio</FieldLabel>
                <Select
                  value={method}
                  onValueChange={(value) => setMethod(value as PaymentMethod)}
                >
                  <SelectTrigger id="transfer-method" className="w-full">
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
            </div>
            <Field data-invalid={errors.file !== undefined}>
              <FieldLabel htmlFor="transfer-receipt">
                Comprobante (opcional)
              </FieldLabel>
              <Input
                id="transfer-receipt"
                type="file"
                accept={RECEIPT_ACCEPT}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              {errors.file ? (
                <FieldError errors={[{ message: errors.file }]} />
              ) : (
                <FieldDescription>Foto o PDF, hasta 10 MB.</FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="transfer-notes">Observaciones</FieldLabel>
              <Textarea
                id="transfer-notes"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
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
            disabled={register.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void confirm()} disabled={register.isPending}>
            Registrar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
