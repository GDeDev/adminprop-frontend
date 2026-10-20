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
import type { ContractDetail } from "@adminprop/shared-types"
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
import { Switch } from "@adminprop/ui/components/switch"
import { Textarea } from "@adminprop/ui/components/textarea"

import { GuarantorSelect } from "@/components/guarantor-select"
import { useUpdateContract } from "@/lib/contracts-api"

export const suretySchema = z
  .object({
    hasSurety: z.boolean(),
    insurerName: z.string().trim().max(120),
    insurerAlertEmail: z.union([
      z.literal(""),
      z.email("Ingresá un email válido.").max(255),
    ]),
    policyNumber: z.string().trim().max(60),
    policyExpiresAt: z.union([
      z.literal(""),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresá una fecha válida."),
    ]),
  })
  .superRefine((values, ctx) => {
    if (values.hasSurety && values.insurerAlertEmail === "") {
      ctx.addIssue({
        code: "custom",
        path: ["insurerAlertEmail"],
        message: "Con caución, el email de alerta es obligatorio.",
      })
    }
  })

const schema = z.object({
  notes: z.string().max(5000),
  guarantorId: z.string().nullable(),
  surety: suretySchema,
})

type FormValues = z.infer<typeof schema>

/**
 * Edición de lo que se puede cambiar después del alta (D-55): notas, garante
 * y caución. El resto cambia por aumento, rescisión o renovación.
 */
export function EditContractDialog({
  contract,
  open,
  onOpenChange,
}: {
  contract: ContractDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateContract()
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      notes: contract.notes ?? "",
      guarantorId: contract.guarantor?.id ?? null,
      surety: {
        hasSurety: contract.hasSurety,
        insurerName: contract.surety?.insurerName ?? "",
        insurerAlertEmail: contract.surety?.insurerAlertEmail ?? "",
        policyNumber: contract.surety?.policyNumber ?? "",
        policyExpiresAt: contract.surety?.policyExpiresAt ?? "",
      },
    },
  })
  const hasSurety = useWatch({
    control: form.control,
    name: "surety.hasSurety",
  })

  async function submit(values: FormValues) {
    setError(null)
    try {
      await update.mutateAsync({
        id: contract.id,
        notes: values.notes.trim() || null,
        guarantorId: values.guarantorId,
        surety: {
          hasSurety: values.surety.hasSurety,
          insurerName: values.surety.insurerName || null,
          insurerAlertEmail: values.surety.insurerAlertEmail || null,
          policyNumber: values.surety.policyNumber || null,
          policyExpiresAt: values.surety.policyExpiresAt || null,
        },
      })
      toast.success("Contrato actualizado.")
      onOpenChange(false)
    } catch (cause) {
      const fields = apiFieldErrors(cause)
      let handled = false
      for (const [field, message] of Object.entries(fields)) {
        const name = field.replace(/^surety\./, "")
        if (name === "notes" || name === "guarantorId") {
          form.setError(name, { message })
          handled = true
        } else if (name in suretySchema.shape) {
          form.setError(`surety.${name as keyof FormValues["surety"]}`, {
            message,
          })
          handled = true
        }
      }
      switch (apiErrorCode(cause)) {
        case "CONTRACT_SURETY_EMAIL_REQUIRED":
          form.setError("surety.insurerAlertEmail", {
            message: "Con caución, el email de alerta es obligatorio.",
          })
          handled = true
          break
        case "CONTRACT_INVALID_GUARANTOR":
          form.setError("guarantorId", {
            message: "Ese garante ya no existe. Elegí otro.",
          })
          handled = true
          break
      }
      if (!handled) {
        setError(apiErrorMessage(cause, "No se pudo guardar el contrato."))
      }
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Editar contrato</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Se pueden cambiar las observaciones, el garante y la caución.
            Montos, fechas y partes cambian con un aumento, una rescisión o una
            renovación.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          id="edit-contract-form"
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
            <Controller
              name="guarantorId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-contract-guarantor">
                    Garante
                  </FieldLabel>
                  <GuarantorSelect
                    id="edit-contract-guarantor"
                    value={field.value}
                    selectedLabel={
                      contract.guarantor?.id === field.value
                        ? contract.guarantor?.fullName
                        : undefined
                    }
                    onChange={(id) => field.onChange(id)}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <SuretyFields form={form} prefix="edit-contract" />
            {hasSurety && (
              <FieldDescription>
                La póliza en PDF se sube desde la ficha.
              </FieldDescription>
            )}
            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-contract-notes">
                    Observaciones internas
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="edit-contract-notes"
                    rows={3}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-contract-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Guardando…" : "Guardar"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

type SuretyValues = { surety: z.infer<typeof suretySchema> }

/**
 * Campos de la caución (spec 5.3, paso 4): un interruptor y, si hay seguro,
 * los datos de la aseguradora. Los comparten el wizard y la edición.
 */
export function SuretyFields<T extends SuretyValues>({
  form,
  prefix,
}: {
  form: ReturnType<typeof useForm<T>>
  prefix: string
}) {
  // El formulario que lo usa tiene más campos; acá sólo importan los de `surety`.
  const control = form.control as unknown as ReturnType<
    typeof useForm<SuretyValues>
  >["control"]
  const hasSurety = useWatch({ control, name: "surety.hasSurety" })

  return (
    <>
      <Controller
        name="surety.hasSurety"
        control={control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Switch
              id={`${prefix}-has-surety`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <FieldLabel htmlFor={`${prefix}-has-surety`}>
              Tiene seguro de caución
            </FieldLabel>
          </Field>
        )}
      />
      {hasSurety && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="surety.insurerName"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${prefix}-insurer-name`}>
                    Aseguradora
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${prefix}-insurer-name`}
                    autoComplete="organization"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="surety.policyNumber"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${prefix}-policy-number`}>
                    Número de póliza
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${prefix}-policy-number`}
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <Controller
            name="surety.insurerAlertEmail"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${prefix}-insurer-email`}>
                  Email de alerta de la aseguradora
                </FieldLabel>
                <Input
                  {...field}
                  id={`${prefix}-insurer-email`}
                  type="email"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Obligatorio: ahí se avisa automáticamente si el inquilino
                    entra en mora.
                  </FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            name="surety.policyExpiresAt"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="sm:max-w-xs">
                <FieldLabel htmlFor={`${prefix}-policy-expires`}>
                  Vencimiento de la póliza
                </FieldLabel>
                <Input
                  {...field}
                  id={`${prefix}-policy-expires`}
                  type="date"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </>
      )}
    </>
  )
}
