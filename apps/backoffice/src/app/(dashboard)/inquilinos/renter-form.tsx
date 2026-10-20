"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeft } from "lucide-react"
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
import type { RenterDetail } from "@adminprop/shared-types"
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
import { Textarea } from "@adminprop/ui/components/textarea"

import { GuarantorSelect } from "@/components/guarantor-select"
import {
  useCreateRenter,
  useRenterDataCheck,
  useUpdateRenter,
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
  moveInDate: z.union([
    z.literal(""),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresá una fecha válida."),
  ]),
  guarantorId: z.string().nullable(),
  notes: z.string().max(5000),
})

type FormValues = z.infer<typeof schema>

function applyApiErrors(error: unknown, setError: UseFormSetError<FormValues>) {
  const fields = apiFieldErrors(error)
  for (const [field, message] of Object.entries(fields)) {
    if (field in schema.shape) setError(field as keyof FormValues, { message })
  }
  switch (apiErrorCode(error)) {
    case "RENTER_NATIONAL_ID_TAKEN":
      setError("nationalId", { message: "Ya hay un inquilino con ese DNI." })
      return true
    case "RENTER_INVALID_NATIONAL_ID":
      setError("nationalId", {
        message: "DNI de 7 u 8 dígitos, o CUIT/CUIL de 11.",
      })
      return true
    case "RENTER_INVALID_MOVE_IN_DATE":
      setError("moveInDate", { message: "Ingresá una fecha válida." })
      return true
    case "RENTER_INVALID_GUARANTOR":
      setError("guarantorId", {
        message: "Ese garante ya no existe. Elegí otro.",
      })
      return true
  }
  return Object.keys(fields).length > 0
}

function initialValues(renter: RenterDetail | undefined): FormValues {
  return {
    firstName: renter?.firstName ?? "",
    lastName: renter?.lastName ?? "",
    nationalId: renter?.nationalId ?? "",
    phone: renter?.phone ?? "",
    email: renter?.email ?? "",
    address: renter?.address ?? "",
    moveInDate: renter?.moveInDate ?? "",
    guarantorId: renter?.guarantor?.id ?? null,
    notes: renter?.notes ?? "",
  }
}

/**
 * Alta y edición de inquilinos (spec Fase 8, 5.3): una pantalla, como
 * propietarios (DT-38). El garante se busca o se crea sin salir del
 * formulario (`GuarantorSelect`).
 */
export function RenterForm({ renter }: { renter?: RenterDetail }) {
  const router = useRouter()
  const editing = renter !== undefined
  const create = useCreateRenter()
  const update = useUpdateRenter()
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(renter),
  })

  const nationalId = useWatch({ control: form.control, name: "nationalId" })
  const nationalIdToCheck = useDebouncedValue(nationalIdDigits(nationalId))
  const check = useRenterDataCheck({
    nationalId: /^\d{7,11}$/.test(nationalIdToCheck)
      ? nationalIdToCheck
      : undefined,
    excludeId: renter?.id,
  })
  const takenBy = check.data?.nationalIdTakenBy ?? null

  async function onSubmit(values: FormValues) {
    setError(null)
    if (takenBy) {
      form.setError("nationalId", {
        message: "Ya hay un inquilino con ese DNI.",
      })
      return
    }
    const body = {
      firstName: values.firstName,
      lastName: values.lastName,
      nationalId: nationalIdDigits(values.nationalId),
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      moveInDate: values.moveInDate || null,
      guarantorId: values.guarantorId,
      notes: values.notes.trim() || null,
    }
    try {
      const saved = editing
        ? await update.mutateAsync({ id: renter.id, ...body })
        : await create.mutateAsync(body)
      toast.success(editing ? "Inquilino actualizado." : "Inquilino creado.")
      router.push(`/inquilinos/${saved.id}`)
    } catch (cause) {
      if (!applyApiErrors(cause, form.setError)) {
        setError(apiErrorMessage(cause, "No se pudo guardar el inquilino."))
      }
    }
  }

  const backHref = editing ? `/inquilinos/${renter.id}` : "/inquilinos"

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          {editing ? renter.fullName : "Inquilinos"}
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {editing ? "Editar inquilino" : "Nuevo inquilino"}
        </h1>
      </div>

      <form
        id="renter-form"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-8"
      >
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              form={form}
              name="firstName"
              label="Nombre"
              autoComplete="given-name"
            />
            <TextField
              form={form}
              name="lastName"
              label="Apellido"
              autoComplete="family-name"
            />
          </div>
          <Controller
            name="nationalId"
            control={form.control}
            render={({ field, fieldState }) => {
              const invalid = fieldState.invalid || takenBy !== null
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor="renter-nationalId">
                    DNI o CUIT
                  </FieldLabel>
                  <Input
                    {...field}
                    id="renter-nationalId"
                    inputMode="numeric"
                    aria-invalid={invalid}
                  />
                  {takenBy ? (
                    <p className="text-sm text-destructive" role="alert">
                      Ya está cargado:{" "}
                      <Link
                        href={`/inquilinos/${takenBy.id}`}
                        className="underline"
                      >
                        {takenBy.fullName}
                      </Link>
                      .
                    </p>
                  ) : fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>
                      Con o sin puntos. Único por inmobiliaria.
                    </FieldDescription>
                  )}
                </Field>
              )
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              form={form}
              name="phone"
              label="Teléfono"
              type="tel"
              autoComplete="tel"
              description="Con código de área, para el botón de WhatsApp."
            />
            <TextField
              form={form}
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              description="Hace falta para darle acceso al portal."
            />
          </div>
          <TextField
            form={form}
            name="address"
            label="Dirección"
            autoComplete="street-address"
          />
          <Controller
            name="moveInDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="sm:max-w-xs">
                <FieldLabel htmlFor="renter-moveInDate">
                  Fecha de ingreso
                </FieldLabel>
                <Input
                  {...field}
                  id="renter-moveInDate"
                  type="date"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Inicio de su primer contrato, si se sabe.
                  </FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            name="guarantorId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="renter-guarantor">Garante</FieldLabel>
                <GuarantorSelect
                  id="renter-guarantor"
                  value={field.value}
                  selectedLabel={
                    renter?.guarantor?.id === field.value
                      ? renter?.guarantor?.fullName
                      : undefined
                  }
                  onChange={(id) => field.onChange(id)}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Buscalo por nombre o DNI; si no está, crealo desde ahí
                    mismo.
                    {editing &&
                      renter.guarantor &&
                      " Cambiarlo queda registrado."}
                  </FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="renter-notes">
                  Observaciones internas
                </FieldLabel>
                <Textarea
                  {...field}
                  id="renter-notes"
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href={backHref}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Guardando…"
              : editing
                ? "Guardar"
                : "Crear inquilino"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function TextField({
  form,
  name,
  label,
  type = "text",
  autoComplete,
  description,
}: {
  form: ReturnType<typeof useForm<FormValues>>
  name: "firstName" | "lastName" | "phone" | "email" | "address"
  label: string
  type?: string
  autoComplete?: string
  description?: string
}) {
  const id = `renter-${name}`
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
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
          />
          {description && !fieldState.invalid && (
            <FieldDescription>{description}</FieldDescription>
          )}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
