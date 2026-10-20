"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Controller,
  useForm,
  useWatch,
  type UseFormSetError,
} from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  apiErrorCode,
  apiErrorMessage,
  apiFieldErrors,
} from "@adminprop/session/client"
import type {
  GuaranteeType,
  GuarantorDetail,
  GuarantorSummary,
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

import { GUARANTEE_DETAIL_HINTS, GUARANTEE_TYPE_LABELS } from "@/lib/renters"
import {
  useCreateGuarantor,
  useGuarantorDataCheck,
  useUpdateGuarantor,
} from "@/lib/renters-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

import { nationalIdDigits } from "../propietarios/owner-form"

const schema = z.object({
  firstName: z.string().trim().min(1, "Ingresá el nombre.").max(100),
  lastName: z.string().trim().min(1, "Ingresá el apellido.").max(100),
  nationalId: z
    .string()
    .trim()
    .refine((value) => /^\d{7,11}$/.test(nationalIdDigits(value)), {
      message: "DNI de 7 u 8 dígitos, o CUIT/CUIL de 11.",
    }),
  phone: z.string().trim().max(40),
  email: z.union([z.literal(""), z.email("Ingresá un email válido.").max(255)]),
  address: z.string().trim().max(200),
  guaranteeType: z.enum(["PROPERTY", "PAYSLIPS"]),
  guaranteeDetail: z.string().trim().min(1, "Describí la garantía.").max(5000),
  notes: z.string().max(5000),
})

type FormValues = z.infer<typeof schema>

function applyApiErrors(error: unknown, setError: UseFormSetError<FormValues>) {
  const fields = apiFieldErrors(error)
  for (const [field, message] of Object.entries(fields)) {
    if (field in schema.shape) setError(field as keyof FormValues, { message })
  }
  switch (apiErrorCode(error)) {
    case "GUARANTOR_NATIONAL_ID_TAKEN":
      setError("nationalId", { message: "Ya hay un garante con ese DNI." })
      return true
    case "GUARANTOR_INVALID_NATIONAL_ID":
      setError("nationalId", {
        message: "DNI de 7 u 8 dígitos, o CUIT/CUIL de 11.",
      })
      return true
    case "GUARANTOR_DETAIL_REQUIRED":
      setError("guaranteeDetail", { message: "Describí la garantía." })
      return true
  }
  return Object.keys(fields).length > 0
}

function initialValues(
  guarantor: GuarantorSummary | GuarantorDetail | null
): FormValues {
  return {
    firstName: guarantor?.firstName ?? "",
    lastName: guarantor?.lastName ?? "",
    nationalId: guarantor?.nationalId ?? "",
    phone: guarantor?.phone ?? "",
    email: guarantor?.email ?? "",
    address: (guarantor && "address" in guarantor && guarantor.address) || "",
    guaranteeType: guarantor?.guaranteeType ?? "PROPERTY",
    guaranteeDetail: guarantor?.guaranteeDetail ?? "",
    notes: (guarantor && "notes" in guarantor && guarantor.notes) || "",
  }
}

/**
 * Alta y edición de garantes (spec Fase 8, 5.4). Diálogo, no página: se usa
 * también desde el formulario de inquilino para crear uno sin salir
 * (spec 5.3). `onSaved` recibe la ficha guardada.
 */
export function GuarantorFormDialog({
  open,
  onOpenChange,
  guarantor,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sin garante: alta. Con garante: edición. */
  guarantor: GuarantorSummary | GuarantorDetail | null
  onSaved?: (guarantor: GuarantorDetail) => void
}) {
  const creating = guarantor === null
  const create = useCreateGuarantor()
  const update = useUpdateGuarantor()
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(guarantor),
  })

  const nationalId = useWatch({ control: form.control, name: "nationalId" })
  const guaranteeType = useWatch({
    control: form.control,
    name: "guaranteeType",
  })
  const nationalIdToCheck = useDebouncedValue(nationalIdDigits(nationalId))
  const check = useGuarantorDataCheck({
    nationalId: /^\d{7,11}$/.test(nationalIdToCheck)
      ? nationalIdToCheck
      : undefined,
    excludeId: guarantor?.id,
  })
  const takenBy = check.data?.nationalIdTakenBy ?? null

  async function onSubmit(values: FormValues) {
    setError(null)
    if (takenBy) {
      form.setError("nationalId", { message: "Ya hay un garante con ese DNI." })
      return
    }
    const body = {
      firstName: values.firstName,
      lastName: values.lastName,
      nationalId: nationalIdDigits(values.nationalId),
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      guaranteeType: values.guaranteeType,
      guaranteeDetail: values.guaranteeDetail,
      notes: values.notes.trim() || null,
    }
    try {
      const saved = creating
        ? await create.mutateAsync(body)
        : await update.mutateAsync({ id: guarantor.id, ...body })
      toast.success(creating ? "Garante creado." : "Garante actualizado.")
      onSaved?.(saved)
      onOpenChange(false)
    } catch (cause) {
      if (!applyApiErrors(cause, form.setError)) {
        setError(apiErrorMessage(cause, "No se pudo guardar el garante."))
      }
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {creating ? "Nuevo garante" : "Editar garante"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Una persona puede garantizar más de un alquiler: se carga una vez y
            se la elige desde cada inquilino.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          id="guarantor-form"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="px-4 md:px-0"
        >
          <FieldGroup>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField form={form} name="firstName" label="Nombre" />
              <TextField form={form} name="lastName" label="Apellido" />
            </div>
            <Controller
              name="nationalId"
              control={form.control}
              render={({ field, fieldState }) => {
                const invalid = fieldState.invalid || takenBy !== null
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor="guarantor-nationalId">
                      DNI o CUIT
                    </FieldLabel>
                    <Input
                      {...field}
                      id="guarantor-nationalId"
                      inputMode="numeric"
                      aria-invalid={invalid}
                    />
                    {takenBy ? (
                      <p className="text-sm text-destructive" role="alert">
                        Ya está cargado:{" "}
                        <Link
                          href={`/garantes/${takenBy.id}`}
                          className="underline"
                        >
                          {takenBy.fullName}
                        </Link>
                        .
                      </p>
                    ) : fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>Con o sin puntos.</FieldDescription>
                    )}
                  </Field>
                )
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField form={form} name="phone" label="Teléfono" type="tel" />
              <TextField form={form} name="email" label="Email" type="email" />
            </div>
            <TextField form={form} name="address" label="Dirección" />
            <Controller
              name="guaranteeType"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="guarantor-type">
                    Tipo de garantía
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as GuaranteeType)
                    }
                  >
                    <SelectTrigger id="guarantor-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(GUARANTEE_TYPE_LABELS) as GuaranteeType[]
                      ).map((key) => (
                        <SelectItem key={key} value={key}>
                          {GUARANTEE_TYPE_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="guaranteeDetail"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="guarantor-detail">
                    {guaranteeType === "PAYSLIPS"
                      ? "Empleador e ingresos"
                      : "Inmueble en garantía"}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="guarantor-detail"
                    rows={3}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>
                      {GUARANTEE_DETAIL_HINTS[guaranteeType]}
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="guarantor-notes">
                    Observaciones internas
                  </FieldLabel>
                  <Textarea {...field} id="guarantor-notes" rows={2} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={form.formState.isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="guarantor-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Guardando…"
              : creating
                ? "Crear garante"
                : "Guardar"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function TextField({
  form,
  name,
  label,
  type = "text",
}: {
  form: ReturnType<typeof useForm<FormValues>>
  name: "firstName" | "lastName" | "phone" | "email" | "address"
  label: string
  type?: string
}) {
  const id = `guarantor-${name}`
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            {...field}
            id={id}
            type={type}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
