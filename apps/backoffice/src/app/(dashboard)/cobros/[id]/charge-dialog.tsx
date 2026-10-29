"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { apiErrorMessage, apiFieldErrors } from "@adminprop/session/client"
import type { ChargeConcept, InstallmentDetail } from "@adminprop/shared-types"
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

import { CHARGE_CONCEPT_LABELS } from "@/lib/billing"
import { useCreateCharge } from "@/lib/billing-api"
import { formatMoney, normalizeAmount } from "@/lib/contracts"

const schema = z.object({
  concept: z.enum(["SERVICE", "TERMINATION_PENALTY", "OTHER"]),
  description: z.string().trim().min(1, "Contá qué se cobra.").max(300),
  amount: z
    .string()
    .refine((value) => normalizeAmount(value) !== null, "Ingresá un monto."),
})

type FormValues = z.infer<typeof schema>

/**
 * Cargo adicional de la cuota (rediseño 3.2): expensas o un servicio que
 * cobra la inmobiliaria, la multa por rescisión (D-56) u otro. No devenga
 * punitorio (A-10).
 */
export function ChargeDialog({
  installment,
  open,
  onOpenChange,
}: {
  installment: Pick<InstallmentDetail, "id" | "currency">
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateCharge()
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { concept: "SERVICE", description: "", amount: "" },
  })

  async function submit(values: FormValues) {
    setError(null)
    try {
      await create.mutateAsync({
        installmentId: installment.id,
        concept: values.concept,
        description: values.description.trim(),
        amount: normalizeAmount(values.amount)!,
      })
      toast.success("Cargo agregado.")
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
        setError(apiErrorMessage(cause, "No se pudo agregar el cargo."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Agregar cargo</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Un concepto además del alquiler, en {installment.currency}. Los
            cargos no generan punitorio.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          id="charge-form"
          onSubmit={form.handleSubmit(submit)}
          className="px-4 sm:px-0"
        >
          <FieldGroup>
            <Controller
              name="concept"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="charge-concept">Concepto</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as ChargeConcept)
                    }
                  >
                    <SelectTrigger id="charge-concept" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(CHARGE_CONCEPT_LABELS) as ChargeConcept[]
                      ).map((c) => (
                        <SelectItem key={c} value={c}>
                          {CHARGE_CONCEPT_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="charge-description">
                    Descripción
                  </FieldLabel>
                  <Input
                    {...field}
                    id="charge-description"
                    placeholder="Expensas de octubre"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="charge-amount">Monto</FieldLabel>
                  <Input
                    {...field}
                    id="charge-amount"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    normalizeAmount(field.value) && (
                      <FieldDescription>
                        {formatMoney(
                          normalizeAmount(field.value)!,
                          installment.currency
                        )}
                      </FieldDescription>
                    )
                  )}
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
            disabled={create.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" form="charge-form" disabled={create.isPending}>
            Agregar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
