"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { apiErrorMessage, apiFieldErrors } from "@adminprop/session/client"
import type {
  Currency,
  FeePayer,
  OwnerRef,
  PaymentMethod,
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
import { CURRENCY_LABELS, formatMoney, normalizeAmount } from "@/lib/contracts"
import { todayIso } from "@/lib/dates"
import { RECEIPT_ACCEPT, receiptProblem } from "@/lib/services"
import { FEE_PAYER_LABELS } from "@/lib/settlements"
import { useRegisterFeePayment } from "@/lib/settlements-api"

const schema = z.object({
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresá la fecha."),
  amount: z
    .string()
    .refine((value) => normalizeAmount(value) !== null, "Ingresá un monto."),
  currency: z.enum(["ARS", "USD"]),
  method: z.enum(["TRANSFER", "CASH", "OTHER"]),
  paidBy: z.enum(["OWNER", "RENTER"]),
  notes: z.string().max(500),
})

type FormValues = z.infer<typeof schema>

/**
 * Pago de honorarios a la inmobiliaria (Micaela 9B y 10): lo paga el
 * propietario o el inquilino por su cuenta; se imputa a los honorarios
 * pendientes más viejos del propietario (y del contrato, si se indica).
 */
export function FeePaymentDialog({
  owner,
  contractId,
  defaultCurrency = "ARS",
  defaultPayer = "OWNER",
  open,
  onOpenChange,
}: {
  owner: OwnerRef
  contractId?: string
  defaultCurrency?: Currency
  defaultPayer?: FeePayer
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const register = useRegisterFeePayment()
  const [file, setFile] = React.useState<File | null>(null)
  const [fileError, setFileError] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paidAt: todayIso(),
      amount: "",
      currency: defaultCurrency,
      method: "TRANSFER",
      paidBy: defaultPayer,
      notes: "",
    },
  })

  async function submit(values: FormValues) {
    setError(null)
    if (file) {
      const problem = receiptProblem(file)
      if (problem) {
        setFileError(problem)
        return
      }
    }
    try {
      const payment = await register.mutateAsync({
        ownerId: owner.id,
        contractId,
        paidAt: values.paidAt,
        amount: normalizeAmount(values.amount)!,
        currency: values.currency,
        method: values.method,
        paidBy: values.paidBy,
        notes: values.notes.trim() || undefined,
        file,
      })
      toast.success(
        payment.unallocatedAmount && payment.unallocatedAmount !== "0.00"
          ? `Pago registrado; ${formatMoney(payment.unallocatedAmount, payment.currency)} quedaron a cuenta de honorarios futuros.`
          : "Pago de honorarios registrado."
      )
      onOpenChange(false)
    } catch (cause) {
      let handled = false
      for (const [field, message] of Object.entries(apiFieldErrors(cause))) {
        if (field in schema.shape) {
          form.setError(field as keyof FormValues, { message })
          handled = true
        }
      }
      if (!handled)
        setError(apiErrorMessage(cause, "No se pudo registrar el pago."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Registrar pago de honorarios
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Honorarios que {owner.fullName} le paga a la inmobiliaria
            {contractId ? " por este contrato" : ""}. Se imputan a los más
            viejos pendientes.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          id="fee-payment-form"
          onSubmit={form.handleSubmit(submit)}
          className="px-4 sm:px-0"
        >
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fee-amount">Monto</FieldLabel>
                    <Input
                      {...field}
                      id="fee-amount"
                      inputMode="decimal"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="currency"
                control={form.control}
                render={({ field }) => (
                  <Field className="sm:w-40">
                    <FieldLabel htmlFor="fee-currency">Moneda</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as Currency)
                      }
                    >
                      <SelectTrigger id="fee-currency" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CURRENCY_LABELS) as Currency[]).map(
                          (c) => (
                            <SelectItem key={c} value={c}>
                              {CURRENCY_LABELS[c]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="paidAt"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fee-date">Fecha</FieldLabel>
                    <Input {...field} id="fee-date" type="date" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="method"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="fee-method">Medio</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as PaymentMethod)
                      }
                    >
                      <SelectTrigger id="fee-method" className="w-full">
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
                )}
              />
            </div>
            <Controller
              name="paidBy"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="fee-payer">Quién paga</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as FeePayer)}
                  >
                    <SelectTrigger id="fee-payer" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FEE_PAYER_LABELS) as FeePayer[]).map(
                        (p) => (
                          <SelectItem key={p} value={p}>
                            {FEE_PAYER_LABELS[p]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Field data-invalid={fileError !== null}>
              <FieldLabel htmlFor="fee-receipt">
                Comprobante (opcional)
              </FieldLabel>
              <Input
                id="fee-receipt"
                type="file"
                accept={RECEIPT_ACCEPT}
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null
                  setFile(next)
                  setFileError(next ? receiptProblem(next) : null)
                }}
              />
              {fileError ? (
                <FieldError errors={[{ message: fileError }]} />
              ) : (
                <FieldDescription>Foto o PDF, hasta 10 MB.</FieldDescription>
              )}
            </Field>
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="fee-notes">Observaciones</FieldLabel>
                  <Textarea {...field} id="fee-notes" rows={2} />
                </Field>
              )}
            />
          </FieldGroup>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={register.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="fee-payment-form"
            disabled={register.isPending}
          >
            Registrar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
