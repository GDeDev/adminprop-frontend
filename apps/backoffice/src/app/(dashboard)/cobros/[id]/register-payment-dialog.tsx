"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  apiErrorCode,
  apiErrorMessage,
  apiFieldErrors,
} from "@adminprop/session/client"
import type {
  Currency,
  ExchangeRateSource,
  InstallmentDetail,
  PaymentMethod,
  PaymentReceiver,
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
import { Switch } from "@adminprop/ui/components/switch"
import { Textarea } from "@adminprop/ui/components/textarea"

import {
  CASH_PAYMENT_METHODS,
  EXCHANGE_RATE_SOURCE_LABELS,
  isZero,
  PAYMENT_METHOD_LABELS,
  PAYMENT_RECEIVER_LABELS,
} from "@/lib/billing"
import { useRegisterPayment } from "@/lib/billing-api"
import { CURRENCY_LABELS, formatMoney, normalizeAmount } from "@/lib/contracts"
import { todayIso } from "@/lib/dates"
import { RECEIPT_ACCEPT, receiptProblem } from "@/lib/services"

const DATE = /^\d{4}-\d{2}-\d{2}$/
const money = z
  .string()
  .refine((value) => normalizeAmount(value) !== null, "Ingresá un monto.")
const optionalMoney = z.union([
  z.literal(""),
  z
    .string()
    .refine((value) => normalizeAmount(value) !== null, "Ingresá un monto."),
])

const schema = z
  .object({
    paidAt: z.string().regex(DATE, "Ingresá la fecha del pago."),
    paidCurrency: z.enum(["ARS", "USD"]),
    amount: money,
    exchangeRate: optionalMoney,
    exchangeRateSource: z.union([
      z.literal(""),
      z.enum(["OFFICIAL", "MEP", "OTHER"]),
    ]),
    exchangeRateDate: z.union([z.literal(""), z.string().regex(DATE)]),
    method: z.enum(["TRANSFER", "CASH", "OTHER"]),
    receivedBy: z.enum(["AGENCY", "OWNER"]),
    applyCredit: z.boolean(),
    manualAllocation: z.boolean(),
    lateFee: optionalMoney,
    rent: optionalMoney,
    charges: optionalMoney,
    notes: z.string().max(1000),
  })
  .superRefine((values, ctx) => {
    // La cotización es obligatoria cuando la moneda difiere (A-9); la API
    // repite la regla (PAYMENT_EXCHANGE_RATE_REQUIRED).
    if (values.exchangeRate !== "" || values.exchangeRateSource !== "") {
      if (values.exchangeRate === "") {
        ctx.addIssue({
          code: "custom",
          path: ["exchangeRate"],
          message: "Ingresá la cotización.",
        })
      }
      if (values.exchangeRateSource === "") {
        ctx.addIssue({
          code: "custom",
          path: ["exchangeRateSource"],
          message: "Elegí la fuente.",
        })
      }
    }
  })

type FormValues = z.infer<typeof schema>

export interface RegisterPaymentDialogProps {
  installment: InstallmentDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Registrar un pago (spec 5.1, rediseño 3.3): parcial o total, en la moneda
 * del contrato o en la otra con cotización, con imputación automática
 * (punitorio → alquiler → cargos, A-8) o manual, y comprobante opcional.
 */
export function RegisterPaymentDialog({
  installment,
  open,
  onOpenChange,
}: RegisterPaymentDialogProps) {
  const register = useRegisterPayment()
  const [file, setFile] = React.useState<File | null>(null)
  const [fileError, setFileError] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const hasCredit = !isZero(installment.creditsAvailable)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paidAt: todayIso(),
      paidCurrency: installment.currency,
      amount: "",
      exchangeRate: "",
      exchangeRateSource: "",
      exchangeRateDate: "",
      method: "TRANSFER",
      receivedBy:
        installment.collectionMode === "OWNER_DIRECT" ? "OWNER" : "AGENCY",
      applyCredit: hasCredit,
      manualAllocation: false,
      lateFee: "",
      rent: "",
      charges: "",
      notes: "",
    },
  })
  const values = useWatch({ control: form.control })
  const foreign = values.paidCurrency !== installment.currency
  const contractMoney = (amount: string) =>
    formatMoney(amount, installment.currency)

  async function submit(data: FormValues) {
    setError(null)
    if (file) {
      const problem = receiptProblem(file)
      if (problem) {
        setFileError(problem)
        return
      }
    }
    if (
      foreign &&
      (data.exchangeRate === "" || data.exchangeRateSource === "")
    ) {
      if (data.exchangeRate === "")
        form.setError("exchangeRate", { message: "Ingresá la cotización." })
      if (data.exchangeRateSource === "")
        form.setError("exchangeRateSource", { message: "Elegí la fuente." })
      return
    }
    try {
      const result = await register.mutateAsync({
        installmentId: installment.id,
        paidAt: data.paidAt,
        paidCurrency: data.paidCurrency,
        amount: normalizeAmount(data.amount)!,
        ...(foreign
          ? {
              exchangeRate: normalizeAmount(data.exchangeRate)!,
              exchangeRateSource: data.exchangeRateSource as ExchangeRateSource,
              exchangeRateDate: data.exchangeRateDate || data.paidAt,
            }
          : {}),
        method: data.method,
        receivedBy: data.receivedBy,
        applyCredit: hasCredit ? data.applyCredit : undefined,
        allocation: data.manualAllocation
          ? {
              lateFee: normalizeAmount(data.lateFee || "0")!,
              rent: normalizeAmount(data.rent || "0")!,
              charges: normalizeAmount(data.charges || "0")!,
            }
          : undefined,
        notes: data.notes.trim() || undefined,
        file,
      })
      const credit = result.payment.creditGenerated
      toast.success(
        isZero(credit)
          ? "Pago registrado."
          : `Pago registrado. ${contractMoney(credit)} quedaron como saldo a favor del inquilino.`
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
      switch (apiErrorCode(cause)) {
        case "PAYMENT_EXCHANGE_RATE_REQUIRED":
          form.setError("exchangeRate", { message: "Ingresá la cotización." })
          handled = true
          break
        case "PAYMENT_INVALID_DATE":
          form.setError("paidAt", {
            message: apiErrorMessage(cause, "La fecha no sirve."),
          })
          handled = true
          break
        case "PAYMENT_INVALID_AMOUNT":
          form.setError("amount", {
            message: "El monto tiene que ser mayor a cero.",
          })
          handled = true
          break
        case "PAYMENT_INVALID_ALLOCATION":
          form.setError("rent", {
            message: apiErrorMessage(
              cause,
              "La imputación tiene que sumar lo pagado y no superar los saldos."
            ),
          })
          handled = true
          break
        case "PAYMENT_INVALID_RECEIPT":
          setFileError(apiErrorMessage(cause, "El comprobante no sirve."))
          handled = true
          break
      }
      if (!handled) {
        setError(apiErrorMessage(cause, "No se pudo registrar el pago."))
      }
    }
  }

  const pending = register.isPending

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Registrar pago</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Saldo de la cuota:{" "}
            <strong>{contractMoney(installment.totalDue)}</strong>
            {" · "}alquiler {contractMoney(installment.rentBalance)}, punitorio{" "}
            {contractMoney(installment.lateFeeBalance)}, cargos{" "}
            {contractMoney(installment.chargesBalance)}. Se puede pagar en
            partes.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          id="register-payment-form"
          onSubmit={form.handleSubmit(submit)}
          className="max-h-[70vh] overflow-y-auto px-4 sm:px-0"
        >
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="payment-amount">
                      Monto pagado
                    </FieldLabel>
                    <Input
                      {...field}
                      id="payment-amount"
                      inputMode="decimal"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>
                        {normalizeAmount(field.value)
                          ? formatMoney(
                              normalizeAmount(field.value)!,
                              values.paidCurrency ?? installment.currency
                            )
                          : "Lo que entregó el inquilino, en la moneda en que pagó."}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
              <Controller
                name="paidCurrency"
                control={form.control}
                render={({ field }) => (
                  <Field className="sm:w-40">
                    <FieldLabel htmlFor="payment-currency">Moneda</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as Currency)
                      }
                    >
                      <SelectTrigger id="payment-currency" className="w-full">
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

            {foreign && (
              <div className="grid gap-4 rounded-lg border p-3 sm:grid-cols-3">
                <Controller
                  name="exchangeRate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="payment-rate">Cotización</FieldLabel>
                      <Input
                        {...field}
                        id="payment-rate"
                        inputMode="decimal"
                        placeholder="Pesos por 1 dólar"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="exchangeRateSource"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="payment-rate-source">
                        Fuente
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          field.onChange(value as ExchangeRateSource)
                        }
                      >
                        <SelectTrigger
                          id="payment-rate-source"
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Elegí" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(
                              EXCHANGE_RATE_SOURCE_LABELS
                            ) as ExchangeRateSource[]
                          ).map((s) => (
                            <SelectItem key={s} value={s}>
                              {EXCHANGE_RATE_SOURCE_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="exchangeRateDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="payment-rate-date">
                        Fecha de la cotización
                      </FieldLabel>
                      <Input {...field} id="payment-rate-date" type="date" />
                      <FieldDescription>
                        Si queda vacía, la del pago.
                      </FieldDescription>
                    </Field>
                  )}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="paidAt"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="payment-date">
                      Fecha del pago
                    </FieldLabel>
                    <Input
                      {...field}
                      id="payment-date"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>
                        La fecha real: de ahí se cuenta el punitorio.
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
              <Controller
                name="method"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="payment-method">
                      Medio de pago
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as PaymentMethod)
                      }
                    >
                      <SelectTrigger id="payment-method" className="w-full">
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
              name="receivedBy"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="payment-received-by">
                    Quién lo recibió
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as PaymentReceiver)
                    }
                  >
                    <SelectTrigger id="payment-received-by" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(
                          PAYMENT_RECEIVER_LABELS
                        ) as PaymentReceiver[]
                      ).map((r) => (
                        <SelectItem key={r} value={r}>
                          {PAYMENT_RECEIVER_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {field.value === "OWNER"
                      ? "Queda como pago informado, pendiente de confirmar. Cuenta para el saldo desde su fecha."
                      : "Entra a la caja de la inmobiliaria y queda confirmado."}
                  </FieldDescription>
                </Field>
              )}
            />

            {hasCredit && (
              <Controller
                name="applyCredit"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="payment-apply-credit"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor="payment-apply-credit">
                      Aplicar primero el saldo a favor (
                      {contractMoney(installment.creditsAvailable)})
                    </FieldLabel>
                  </Field>
                )}
              />
            )}

            <Controller
              name="manualAllocation"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="payment-manual-allocation"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="payment-manual-allocation">
                    Imputar a mano
                  </FieldLabel>
                </Field>
              )}
            />
            <FieldDescription>
              {values.manualAllocation
                ? `En la moneda del contrato (${installment.currency}); tiene que sumar lo pagado.`
                : "Sin indicar nada, el pago cubre primero el punitorio, después el alquiler y por último los cargos. Lo que sobra queda como saldo a favor."}
            </FieldDescription>
            {values.manualAllocation && (
              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ["lateFee", "Punitorio", installment.lateFeeBalance],
                    ["rent", "Alquiler", installment.rentBalance],
                    ["charges", "Cargos", installment.chargesBalance],
                  ] as const
                ).map(([name, label, balance]) => (
                  <Controller
                    key={name}
                    name={name}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={`payment-${name}`}>
                          {label}
                        </FieldLabel>
                        <Input
                          {...field}
                          id={`payment-${name}`}
                          inputMode="decimal"
                          placeholder="0"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : (
                          <FieldDescription>
                            Saldo {contractMoney(balance)}
                          </FieldDescription>
                        )}
                      </Field>
                    )}
                  />
                ))}
              </div>
            )}

            <Field data-invalid={fileError !== null}>
              <FieldLabel htmlFor="payment-receipt">
                Comprobante (opcional)
              </FieldLabel>
              <Input
                id="payment-receipt"
                type="file"
                accept={RECEIPT_ACCEPT}
                aria-invalid={fileError !== null}
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null
                  setFile(next)
                  setFileError(next ? receiptProblem(next) : null)
                }}
              />
              {fileError ? (
                <FieldError errors={[{ message: fileError }]} />
              ) : (
                <FieldDescription>
                  Foto o PDF de la transferencia, hasta 10 MB.
                </FieldDescription>
              )}
            </Field>

            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="payment-notes">Observaciones</FieldLabel>
                  <Textarea {...field} id="payment-notes" rows={2} />
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
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" form="register-payment-form" disabled={pending}>
            Registrar pago
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
