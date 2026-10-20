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
  AdvanceExpense,
  ContractDetail,
  Currency,
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

import { CURRENCY_LABELS, formatMoney, normalizeAmount } from "@/lib/contracts"
import { todayIso } from "@/lib/dates"
import { RECEIPT_ACCEPT, receiptProblem } from "@/lib/services"
import {
  useCreateAdvanceExpense,
  useUpdateAdvanceExpense,
} from "@/lib/services-api"

const schema = z.object({
  amount: z
    .string()
    .refine((value) => normalizeAmount(value) !== null, "Ingresá un monto."),
  description: z.string().trim().min(1, "Contá qué se pagó.").max(500),
  expenseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresá una fecha válida."),
  currency: z.enum(["ARS", "USD"]),
})

type FormValues = z.infer<typeof schema>

export interface AdvanceExpenseDialogProps {
  contract: Pick<ContractDetail, "id" | "currency">
  /** Si viene, se edita (monto, descripción y fecha); si no, es un alta con comprobante. */
  expense?: AdvanceExpense
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Registrar o corregir un gasto que el inquilino adelantó (spec 5.2). El
 * comprobante es obligatorio al registrar (DT-55): es plata que después se
 * le descuenta al propietario. Un gasto ya descontado no se toca (409).
 */
export function AdvanceExpenseDialog({
  contract,
  expense,
  open,
  onOpenChange,
}: AdvanceExpenseDialogProps) {
  const create = useCreateAdvanceExpense()
  const update = useUpdateAdvanceExpense()
  const editing = expense !== undefined
  const [error, setError] = React.useState<string | null>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [fileError, setFileError] = React.useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: expense?.amount ?? "",
      description: expense?.description ?? "",
      expenseDate: expense?.expenseDate ?? todayIso(),
      currency: expense?.currency ?? contract.currency,
    },
  })
  const amountPreview = normalizeAmount(
    useWatch({ control: form.control, name: "amount" })
  )
  const currency = useWatch({ control: form.control, name: "currency" })

  function pickFile(list: FileList | null) {
    const picked = list?.[0] ?? null
    setFile(picked)
    setFileError(picked ? receiptProblem(picked) : null)
  }

  async function submit(values: FormValues) {
    setError(null)
    const amount = normalizeAmount(values.amount)!
    if (!editing) {
      // Sin comprobante no se manda: la API también lo rechaza (400).
      const problem = file ? receiptProblem(file) : "Adjuntá el comprobante."
      if (problem) {
        setFileError(problem)
        return
      }
    }
    try {
      if (expense) {
        await update.mutateAsync({
          id: expense.id,
          contractId: contract.id,
          amount,
          description: values.description,
          expenseDate: values.expenseDate,
        })
        toast.success("Gasto actualizado.")
      } else {
        await create.mutateAsync({
          contractId: contract.id,
          amount,
          description: values.description,
          expenseDate: values.expenseDate,
          currency: values.currency,
          file: file!,
        })
        toast.success("Gasto registrado.")
      }
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
        case "EXPENSE_RECEIPT_REQUIRED":
          setFileError("Adjuntá el comprobante.")
          handled = true
          break
        case "EXPENSE_INVALID_RECEIPT":
          setFileError(
            "El comprobante tiene que ser una foto (JPG, PNG o WebP) o un PDF."
          )
          handled = true
          break
        case "EXPENSE_INVALID_AMOUNT":
          form.setError("amount", {
            message: "El monto tiene que ser mayor a cero.",
          })
          handled = true
          break
        case "EXPENSE_INVALID_DATE":
          form.setError("expenseDate", { message: "Ingresá una fecha válida." })
          handled = true
          break
        case "EXPENSE_ALREADY_SETTLED":
          // Ya lo descontó una liquidación: es un registro cerrado.
          toast.error(
            apiErrorMessage(
              cause,
              "Ese gasto ya se descontó: no se puede editar."
            )
          )
          onOpenChange(false)
          return
      }
      if (!handled) {
        setError(apiErrorMessage(cause, "No se pudo guardar el gasto."))
      }
    }
  }

  const pending = form.formState.isSubmitting

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {editing ? "Editar gasto" : "Registrar gasto adelantado"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {editing
              ? "Se puede corregir el monto, la descripción y la fecha. El comprobante queda como está."
              : "Lo que pagó el inquilino y después se le descuenta al propietario en la liquidación. Con comprobante, siempre."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          id="advance-expense-form"
          onSubmit={form.handleSubmit(submit)}
          noValidate
          className="max-h-[60vh] overflow-y-auto px-4 md:px-0"
        >
          <FieldGroup>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="expense-amount">Monto</FieldLabel>
                    <Input
                      {...field}
                      id="expense-amount"
                      inputMode="decimal"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>
                        {amountPreview
                          ? formatMoney(amountPreview, currency)
                          : "Con coma o punto para los centavos."}
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
              {!editing && (
                <Controller
                  name="currency"
                  control={form.control}
                  render={({ field }) => (
                    <Field className="sm:w-44">
                      <FieldLabel htmlFor="expense-currency">Moneda</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          field.onChange(value as Currency)
                        }
                      >
                        <SelectTrigger id="expense-currency" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(CURRENCY_LABELS) as Currency[]).map(
                            (option) => (
                              <SelectItem key={option} value={option}>
                                {CURRENCY_LABELS[option]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              )}
            </div>
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="expense-description">
                    Qué se pagó
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="expense-description"
                    rows={2}
                    placeholder="Arreglo de la canilla del baño"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="expenseDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="sm:max-w-xs"
                >
                  <FieldLabel htmlFor="expense-date">
                    Fecha del gasto
                  </FieldLabel>
                  <Input
                    {...field}
                    id="expense-date"
                    type="date"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {!editing && (
              <Field data-invalid={fileError !== null}>
                <FieldLabel htmlFor="expense-receipt">Comprobante</FieldLabel>
                <Input
                  id="expense-receipt"
                  type="file"
                  accept={RECEIPT_ACCEPT}
                  aria-invalid={fileError !== null}
                  onChange={(event) => pickFile(event.target.files)}
                />
                {fileError ? (
                  <FieldError>{fileError}</FieldError>
                ) : (
                  <FieldDescription>
                    {file
                      ? file.name
                      : "Obligatorio: foto (JPG, PNG o WebP) o PDF, hasta 10 MB."}
                  </FieldDescription>
                )}
              </Field>
            )}
          </FieldGroup>
        </form>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" form="advance-expense-form" disabled={pending}>
            {pending ? "Guardando…" : editing ? "Guardar" : "Registrar gasto"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
