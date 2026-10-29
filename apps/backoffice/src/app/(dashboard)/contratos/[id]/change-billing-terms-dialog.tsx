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
  CollectionMode,
  ContractCurrentBillingTerms,
  Currency,
  FeeMode,
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

import { COLLECTION_MODE_LABELS, FEE_MODE_LABELS } from "@/lib/billing"
import { normalizeAmount } from "@/lib/contracts"
import { useChangeBillingTerms } from "@/lib/contracts-api"
import { todayIso } from "@/lib/dates"

const DATE = /^\d{4}-\d{2}-\d{2}$/

export const billingTermsSchema = z
  .object({
    collectionMode: z.enum(["AGENCY", "OWNER_DIRECT"]),
    feeMode: z.enum(["DEDUCTED", "OWNER_PAYS", "RENTER_PAYS_ON_BEHALF"]),
    feeKind: z.enum(["PERCENTAGE", "FIXED"]),
    feePercentage: z.string(),
    feeAmount: z.string(),
    customLateFee: z.boolean(),
    lateFeePercentage: z.string(),
    lateFeeGraceDays: z.string(),
  })
  .superRefine((values, ctx) => {
    if (
      values.feeKind === "PERCENTAGE" &&
      normalizeAmount(values.feePercentage) === null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["feePercentage"],
        message: "Ingresá el porcentaje de honorarios.",
      })
    }
    if (
      values.feeKind === "FIXED" &&
      normalizeAmount(values.feeAmount) === null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["feeAmount"],
        message: "Ingresá el importe fijo.",
      })
    }
    if (values.customLateFee) {
      if (normalizeAmount(values.lateFeePercentage) === null) {
        ctx.addIssue({
          code: "custom",
          path: ["lateFeePercentage"],
          message: "Ingresá el porcentaje diario.",
        })
      }
      if (!/^\d{1,2}$/.test(values.lateFeeGraceDays.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["lateFeeGraceDays"],
          message: "Ingresá los días de gracia (0 a 31).",
        })
      }
    }
  })

export type BillingTermsValues = z.infer<typeof billingTermsSchema>

const schema = billingTermsSchema.safeExtend({
  effectiveFrom: z.string().regex(DATE, "Ingresá la fecha."),
  notes: z.string().max(500),
})

type FormValues = z.infer<typeof schema>

/** Las condiciones de cobro a partir de una fecha (admin). */
export function ChangeBillingTermsDialog({
  contract,
  terms,
  open,
  onOpenChange,
}: {
  contract: {
    id: string
    currency: Currency
    startDate: string
    endDate: string
  }
  terms: ContractCurrentBillingTerms
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const change = useChangeBillingTerms()
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      effectiveFrom: todayIso(),
      collectionMode: terms.collectionMode,
      feeMode: terms.feeMode,
      feeKind: terms.feeAmount ? "FIXED" : "PERCENTAGE",
      feePercentage: terms.feePercentage,
      feeAmount: terms.feeAmount ?? "",
      customLateFee:
        !terms.inheritedLateFeePercentage || !terms.inheritedLateFeeGraceDays,
      lateFeePercentage: terms.lateFeePercentage ?? "",
      lateFeeGraceDays:
        terms.lateFeeGraceDays === null ? "" : String(terms.lateFeeGraceDays),
      notes: "",
    },
  })

  async function submit(values: FormValues) {
    setError(null)
    try {
      await change.mutateAsync({
        id: contract.id,
        effectiveFrom: values.effectiveFrom,
        collectionMode: values.collectionMode,
        feeMode: values.feeMode,
        feePercentage:
          values.feeKind === "PERCENTAGE"
            ? normalizeAmount(values.feePercentage)!
            : undefined,
        feeAmount:
          values.feeKind === "FIXED"
            ? normalizeAmount(values.feeAmount)!
            : null,
        lateFeePercentage: values.customLateFee
          ? normalizeAmount(values.lateFeePercentage)!
          : null,
        lateFeeGraceDays: values.customLateFee
          ? Number(values.lateFeeGraceDays)
          : null,
        notes: values.notes.trim() || undefined,
      })
      toast.success("Términos de cobro actualizados.")
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
        case "CONTRACT_BILLING_TERMS_NOT_AFTER_LATEST":
        case "CONTRACT_BILLING_TERMS_OUT_OF_RANGE":
          form.setError("effectiveFrom", {
            message: apiErrorMessage(cause, "La fecha no sirve."),
          })
          handled = true
          break
      }
      if (!handled)
        setError(apiErrorMessage(cause, "No se pudieron guardar los términos."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Cambiar términos de cobro
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Rigen desde la fecha indicada para las cuotas que se generen a
            partir de ahí. Las anteriores conservan los suyos y el historial
            queda guardado.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          id="billing-terms-form"
          onSubmit={form.handleSubmit(submit)}
          className="max-h-[70vh] overflow-y-auto px-4 sm:px-0"
        >
          <FieldGroup>
            <Controller
              name="effectiveFrom"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="sm:max-w-xs"
                >
                  <FieldLabel htmlFor="terms-effective-from">Desde</FieldLabel>
                  <Input {...field} id="terms-effective-from" type="date" />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <BillingTermsFields
              form={form}
              prefix="terms"
              currency={contract.currency}
            />
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="terms-notes">Motivo</FieldLabel>
                  <Textarea {...field} id="terms-notes" rows={2} />
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
            disabled={change.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="billing-terms-form"
            disabled={change.isPending}
          >
            Guardar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

/**
 * Los campos de los términos, compartidos con el paso "Condiciones" del
 * wizard de contratos. El formulario que los usa tiene más campos; acá sólo
 * importan los de `billingTermsSchema`.
 */
export function BillingTermsFields<T extends BillingTermsValues>({
  form,
  prefix,
  currency,
  percentageEditable = true,
}: {
  form: ReturnType<typeof useForm<T>>
  prefix: string
  currency: Currency
  /** En el alta el % lo fija la API según el propietario (D-57). */
  percentageEditable?: boolean
}) {
  const control = form.control as unknown as ReturnType<
    typeof useForm<BillingTermsValues>
  >["control"]
  const feeKind = useWatch({ control, name: "feeKind" })
  const customLateFee = useWatch({ control, name: "customLateFee" })

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="collectionMode"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={`${prefix}-collection-mode`}>
                Quién cobra
              </FieldLabel>
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as CollectionMode)
                }
              >
                <SelectTrigger
                  id={`${prefix}-collection-mode`}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(COLLECTION_MODE_LABELS) as CollectionMode[]
                  ).map((m) => (
                    <SelectItem key={m} value={m}>
                      {COLLECTION_MODE_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {field.value === "OWNER_DIRECT"
                  ? "Los pagos se cargan como informados y los honorarios quedan a cobrar."
                  : "El alquiler entra a la inmobiliaria y se liquida al propietario."}
              </FieldDescription>
            </Field>
          )}
        />
        <Controller
          name="feeMode"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={`${prefix}-fee-mode`}>Honorarios</FieldLabel>
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as FeeMode)}
              >
                <SelectTrigger id={`${prefix}-fee-mode`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FEE_MODE_LABELS) as FeeMode[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {FEE_MODE_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <Controller
          name="feeKind"
          control={control}
          render={({ field }) => (
            <Field className="sm:w-44">
              <FieldLabel htmlFor={`${prefix}-fee-kind`}>
                Cómo se calculan
              </FieldLabel>
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as "PERCENTAGE" | "FIXED")
                }
              >
                <SelectTrigger id={`${prefix}-fee-kind`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Porcentaje</SelectItem>
                  <SelectItem value="FIXED">Importe fijo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        {feeKind === "FIXED" ? (
          <Controller
            name="feeAmount"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${prefix}-fee-amount`}>
                  Importe fijo por mes ({currency})
                </FieldLabel>
                <Input
                  {...field}
                  id={`${prefix}-fee-amount`}
                  inputMode="decimal"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ) : !percentageEditable ? (
          <Field>
            <FieldLabel>Porcentaje del alquiler</FieldLabel>
            <FieldDescription>
              Lo fija la inmobiliaria según el propietario: honorario estándar o
              reducido. Se puede cambiar después desde la ficha.
            </FieldDescription>
          </Field>
        ) : (
          <Controller
            name="feePercentage"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${prefix}-fee-percentage`}>
                  Porcentaje del alquiler
                </FieldLabel>
                <Input
                  {...field}
                  id={`${prefix}-fee-percentage`}
                  inputMode="decimal"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Sobre el alquiler cobrado, sin punitorios ni expensas.
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        )}
      </div>
      <Controller
        name="customLateFee"
        control={control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Switch
              id={`${prefix}-custom-late-fee`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <FieldLabel htmlFor={`${prefix}-custom-late-fee`}>
              Punitorio propio (si no, el de la inmobiliaria)
            </FieldLabel>
          </Field>
        )}
      />
      {customLateFee && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="lateFeePercentage"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${prefix}-late-fee`}>% diario</FieldLabel>
                <Input
                  {...field}
                  id={`${prefix}-late-fee`}
                  inputMode="decimal"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Interés simple sobre el alquiler impago de cada día.
                  </FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            name="lateFeeGraceDays"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${prefix}-grace-days`}>
                  Días de gracia
                </FieldLabel>
                <Input
                  {...field}
                  id={`${prefix}-grace-days`}
                  inputMode="numeric"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Del 1 al N del mes no corre punitorio.
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        </div>
      )}
    </>
  )
}
