"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { apiErrorMessage, apiFieldErrors } from "@adminprop/session/client"
import type {
  SettlementAdjustmentConcept,
  SettlementDetail,
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

import { formatMoney, normalizeAmount } from "@/lib/contracts"
import {
  ADJUSTMENT_CONCEPT_LABELS,
  adjustmentSubtracts,
} from "@/lib/settlements"
import { useAddSettlementAdjustment } from "@/lib/settlements-api"

const schema = z.object({
  concept: z.enum([
    "WITHHOLDING",
    "OWNER_ADVANCE",
    "OTHER_DEDUCTION",
    "OTHER_CREDIT",
  ]),
  description: z.string().trim().min(1, "Contá de qué se trata.").max(300),
  amount: z
    .string()
    .refine((value) => normalizeAmount(value) !== null, "Ingresá un monto."),
})

type FormValues = z.infer<typeof schema>

/** Retenciones, adelantos y otros rubros manuales (A-20). */
export function AdjustmentDialog({
  settlement,
  open,
  onOpenChange,
}: {
  settlement: Pick<SettlementDetail, "id" | "currency">
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const add = useAddSettlementAdjustment()
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { concept: "WITHHOLDING", description: "", amount: "" },
  })

  async function submit(values: FormValues) {
    setError(null)
    try {
      await add.mutateAsync({
        id: settlement.id,
        concept: values.concept,
        description: values.description.trim(),
        amount: normalizeAmount(values.amount)!,
      })
      toast.success("Ajuste agregado.")
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
        setError(apiErrorMessage(cause, "No se pudo agregar el ajuste."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Agregar ajuste</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Una retención, un adelanto que ya se le dio al propietario u otro
            concepto. En {settlement.currency}.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          id="adjustment-form"
          onSubmit={form.handleSubmit(submit)}
          className="px-4 sm:px-0"
        >
          <FieldGroup>
            <Controller
              name="concept"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="adjustment-concept">Concepto</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as SettlementAdjustmentConcept)
                    }
                  >
                    <SelectTrigger id="adjustment-concept" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(
                          ADJUSTMENT_CONCEPT_LABELS
                        ) as SettlementAdjustmentConcept[]
                      ).map((c) => (
                        <SelectItem key={c} value={c}>
                          {ADJUSTMENT_CONCEPT_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {adjustmentSubtracts(field.value)
                      ? "Resta del neto a transferir."
                      : "Suma al neto a transferir."}
                  </FieldDescription>
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="adjustment-description">
                    Descripción
                  </FieldLabel>
                  <Input
                    {...field}
                    id="adjustment-description"
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
                  <FieldLabel htmlFor="adjustment-amount">Monto</FieldLabel>
                  <Input
                    {...field}
                    id="adjustment-amount"
                    inputMode="decimal"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    normalizeAmount(field.value) && (
                      <FieldDescription>
                        {formatMoney(
                          normalizeAmount(field.value)!,
                          settlement.currency
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
            disabled={add.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" form="adjustment-form" disabled={add.isPending}>
            Agregar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
