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
  IncreaseFrequency,
  PropertyService,
  ServicePayer,
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

import { MasterDataSelect } from "@/components/master-data-select"
import { CURRENCY_LABELS } from "@/lib/contracts"
import { INCREASE_FREQUENCY_LABELS, SERVICE_PAYER_LABELS } from "@/lib/services"
import { useCreateService, useUpdateService } from "@/lib/services-api"

const schema = z
  .object({
    serviceTypeId: z.string().min(1, "Elegí el tipo de servicio."),
    paidBy: z.enum(["RENTER", "OWNER"]),
    currency: z.enum(["ARS", "USD"]),
    hasDueDate: z.boolean(),
    dueDate: z.union([
      z.literal(""),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresá una fecha válida."),
    ]),
    hasIncrease: z.boolean(),
    increaseFrequency: z.union([
      z.literal(""),
      z.enum(["MONTHLY", "QUARTERLY", "FOUR_MONTHLY"]),
    ]),
    managedByAgency: z.boolean(),
    notes: z.string().max(2000),
  })
  .superRefine((values, ctx) => {
    // Las mismas reglas que la API (SERVICE_DUE_DATE_REQUIRED y
    // SERVICE_INCREASE_FREQUENCY_REQUIRED), para avisar antes de mandar.
    if (values.hasDueDate && values.dueDate === "") {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Con vencimiento, la fecha es obligatoria.",
      })
    }
    if (values.hasIncrease && values.increaseFrequency === "") {
      ctx.addIssue({
        code: "custom",
        path: ["increaseFrequency"],
        message: "Con aumentos, la frecuencia es obligatoria.",
      })
    }
  })

type FormValues = z.infer<typeof schema>

export interface ServiceFormDialogProps {
  propertyId: string
  /** Con contrato, el servicio nuevo es de ese contrato; sin él, de la propiedad. */
  contractId?: string
  /** Si viene, se edita; si no, es un alta. */
  service?: PropertyService
  /** Moneda inicial del alta (la del contrato, si hay). */
  defaultCurrency?: Currency
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Alta rápida y edición de un servicio (spec 5.1): bottom sheet en mobile,
 * con la fecha y la frecuencia que aparecen sólo al prender su interruptor.
 */
export function ServiceFormDialog({
  propertyId,
  contractId,
  service,
  defaultCurrency = "ARS",
  open,
  onOpenChange,
}: ServiceFormDialogProps) {
  const create = useCreateService()
  const update = useUpdateService()
  const [error, setError] = React.useState<string | null>(null)
  const editing = service !== undefined
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceTypeId: service?.serviceType?.id ?? "",
      paidBy: service?.paidBy ?? "RENTER",
      currency: service?.currency ?? defaultCurrency,
      hasDueDate: service?.hasDueDate ?? false,
      dueDate: service?.dueDate ?? "",
      hasIncrease: service?.hasIncrease ?? false,
      increaseFrequency: service?.increaseFrequency ?? "",
      managedByAgency: service?.managedByAgency ?? false,
      notes: service?.notes ?? "",
    },
  })
  const hasDueDate = useWatch({ control: form.control, name: "hasDueDate" })
  const hasIncrease = useWatch({ control: form.control, name: "hasIncrease" })

  async function submit(values: FormValues) {
    setError(null)
    const body = {
      serviceTypeId: values.serviceTypeId,
      paidBy: values.paidBy,
      currency: values.currency,
      hasDueDate: values.hasDueDate,
      dueDate: values.hasDueDate ? values.dueDate : null,
      hasIncrease: values.hasIncrease,
      increaseFrequency: values.hasIncrease
        ? (values.increaseFrequency as IncreaseFrequency)
        : null,
      managedByAgency: values.managedByAgency,
      notes: values.notes.trim() || null,
    }
    try {
      if (service) {
        await update.mutateAsync({ id: service.id, ...body })
        toast.success("Servicio actualizado.")
      } else {
        await create.mutateAsync({
          propertyId,
          contractId: contractId ?? null,
          ...body,
        })
        toast.success("Servicio agregado.")
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
        case "SERVICE_DUE_DATE_REQUIRED":
          form.setError("dueDate", {
            message: "Con vencimiento, la fecha es obligatoria.",
          })
          handled = true
          break
        case "SERVICE_INVALID_DATE":
          form.setError("dueDate", { message: "Ingresá una fecha válida." })
          handled = true
          break
        case "SERVICE_INCREASE_FREQUENCY_REQUIRED":
          form.setError("increaseFrequency", {
            message: "Con aumentos, la frecuencia es obligatoria.",
          })
          handled = true
          break
        case "SERVICE_INVALID_SERVICE_TYPE":
          form.setError("serviceTypeId", {
            message: "Ese tipo de servicio no está disponible. Elegí otro.",
          })
          handled = true
          break
      }
      if (!handled) {
        setError(apiErrorMessage(cause, "No se pudo guardar el servicio."))
      }
    }
  }

  const pending = form.formState.isSubmitting

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {editing ? "Editar servicio" : "Agregar servicio"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {contractId && !editing
              ? "Queda asociado a este contrato. Los de la propiedad se cargan desde su ficha."
              : "Qué servicio tiene la propiedad, quién lo paga y cuándo vence."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          id="service-form"
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
              name="serviceTypeId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="service-type">
                    Tipo de servicio
                  </FieldLabel>
                  <MasterDataSelect
                    id="service-type"
                    source="service-types"
                    value={field.value || null}
                    onChange={(id) => field.onChange(id ?? "")}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="paidBy"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="service-paid-by">
                      Quién lo paga
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as ServicePayer)
                      }
                    >
                      <SelectTrigger id="service-paid-by" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(SERVICE_PAYER_LABELS) as ServicePayer[]
                        ).map((payer) => (
                          <SelectItem key={payer} value={payer}>
                            {SERVICE_PAYER_LABELS[payer]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="currency"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="service-currency">Moneda</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as Currency)
                      }
                    >
                      <SelectTrigger id="service-currency" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CURRENCY_LABELS) as Currency[]).map(
                          (currency) => (
                            <SelectItem key={currency} value={currency}>
                              {CURRENCY_LABELS[currency]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>

            <Controller
              name="hasDueDate"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="service-has-due-date"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="service-has-due-date">
                    Tiene vencimiento
                  </FieldLabel>
                </Field>
              )}
            />
            {hasDueDate && (
              <Controller
                name="dueDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="sm:max-w-xs"
                  >
                    <FieldLabel htmlFor="service-due-date">
                      Fecha de vencimiento
                    </FieldLabel>
                    <Input
                      {...field}
                      id="service-due-date"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>
                        Pasada esa fecha, el servicio figura como vencido.
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            )}

            <Controller
              name="hasIncrease"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="service-has-increase"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="service-has-increase">
                    Tiene aumentos periódicos
                  </FieldLabel>
                </Field>
              )}
            />
            {hasIncrease && (
              <Controller
                name="increaseFrequency"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="sm:max-w-xs"
                  >
                    <FieldLabel htmlFor="service-increase-frequency">
                      Frecuencia del aumento
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as IncreaseFrequency)
                      }
                    >
                      <SelectTrigger
                        id="service-increase-frequency"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Elegí la frecuencia" />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(
                            INCREASE_FREQUENCY_LABELS
                          ) as IncreaseFrequency[]
                        ).map((frequency) => (
                          <SelectItem key={frequency} value={frequency}>
                            {INCREASE_FREQUENCY_LABELS[frequency]}
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
            )}

            <Controller
              name="managedByAgency"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="service-managed-by-agency"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="service-managed-by-agency">
                    Lo gestiona la inmobiliaria
                  </FieldLabel>
                </Field>
              )}
            />
            <FieldDescription>
              Si no, es informativo: igual se puede controlar el vencimiento.
            </FieldDescription>

            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="service-notes">Observaciones</FieldLabel>
                  <Textarea
                    {...field}
                    id="service-notes"
                    rows={2}
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" form="service-form" disabled={pending}>
            {pending ? "Guardando…" : editing ? "Guardar" : "Agregar servicio"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
