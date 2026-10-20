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
import type { OwnerDetail } from "@adminprop/shared-types"
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

import {
  useCreateOwner,
  useOwnerDataCheck,
  useUpdateOwner,
} from "@/lib/owners-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

import {
  BankAccountFields,
  bankAccountSchema,
  cbuDigits,
  emptyBankAccount,
} from "./bank-account-fields"

/** "20.123.456" → "20123456". La API guarda sólo dígitos (D-41). */
export function nationalIdDigits(value: string): string {
  return value.replace(/[\s.-]/g, "")
}

const optionalText = (max: number) => z.string().trim().max(max)

const schema = z.object({
  firstName: z.string().trim().min(1, "Ingresá el nombre.").max(100),
  lastName: z.string().trim().min(1, "Ingresá el apellido.").max(100),
  nationalId: z
    .string()
    .trim()
    .refine((value) => /^\d{7,11}$/.test(nationalIdDigits(value)), {
      message: "DNI de 7 u 8 dígitos, o CUIT/CUIL de 11.",
    }),
  phone: optionalText(40),
  email: z.union([z.literal(""), z.email("Ingresá un email válido.").max(255)]),
  address: optionalText(200),
  notes: z.string().max(5000),
  bankAccount: bankAccountSchema,
})

type FormValues = z.infer<typeof schema>

/** Lleva al formulario los errores por campo y los códigos conocidos de la API. */
function applyApiErrors(error: unknown, setError: UseFormSetError<FormValues>) {
  const fields = apiFieldErrors(error)
  for (const [field, message] of Object.entries(fields)) {
    if (field in schema.shape) setError(field as keyof FormValues, { message })
    if (field === "cbu") setError("bankAccount.cbu", { message })
  }
  switch (apiErrorCode(error)) {
    case "OWNER_NATIONAL_ID_TAKEN":
      setError("nationalId", { message: "Ya hay un propietario con ese DNI." })
      return true
    case "OWNER_INVALID_NATIONAL_ID":
      setError("nationalId", {
        message: "DNI de 7 u 8 dígitos, o CUIT/CUIL de 11.",
      })
      return true
    case "OWNER_INVALID_CBU":
      setError("bankAccount.cbu", { message: "El CBU no es válido." })
      return true
  }
  return Object.keys(fields).length > 0
}

function initialValues(owner: OwnerDetail | undefined): FormValues {
  return {
    firstName: owner?.firstName ?? "",
    lastName: owner?.lastName ?? "",
    nationalId: owner?.nationalId ?? "",
    phone: owner?.phone ?? "",
    email: owner?.email ?? "",
    address: owner?.address ?? "",
    notes: owner?.notes ?? "",
    bankAccount: emptyBankAccount(),
  }
}

/**
 * Alta y edición de propietarios (spec Fase 7, 5.3). Una sola pantalla, sin
 * wizard: son pocos campos. En el alta la cuenta bancaria va en el mismo
 * formulario; en la edición se cambia desde la ficha, con su propia acción
 * (D-40: queda como un registro aparte en la auditoría).
 */
export function OwnerForm({ owner }: { owner?: OwnerDetail }) {
  const router = useRouter()
  const editing = owner !== undefined
  const create = useCreateOwner()
  const update = useUpdateOwner()
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(owner),
  })

  // Chequeo en vivo (spec 5.3): DNI tomado y CBU compartido, con debounce.
  const nationalId = useWatch({ control: form.control, name: "nationalId" })
  const cbu = useWatch({ control: form.control, name: "bankAccount.cbu" })
  const nationalIdToCheck = useDebouncedValue(nationalIdDigits(nationalId))
  const cbuToCheck = useDebouncedValue(cbuDigits(cbu))
  const check = useOwnerDataCheck({
    nationalId: /^\d{7,11}$/.test(nationalIdToCheck)
      ? nationalIdToCheck
      : undefined,
    cbu: !editing && cbuToCheck.length === 22 ? cbuToCheck : undefined,
    excludeId: owner?.id,
  })
  const takenBy = check.data?.nationalIdTakenBy ?? null
  const cbuSharedWith = check.data?.cbuSharedWith ?? []

  async function onSubmit(values: FormValues) {
    setError(null)
    if (takenBy) {
      form.setError("nationalId", {
        message: "Ya hay un propietario con ese DNI.",
      })
      return
    }
    const personal = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      notes: values.notes.trim() || null,
    }
    try {
      if (editing) {
        await update.mutateAsync({
          id: owner.id,
          ...personal,
          nationalId: nationalIdDigits(values.nationalId),
        })
        toast.success("Propietario actualizado.")
        router.push(`/propietarios/${owner.id}`)
      } else {
        const account = values.bankAccount
        const saved = await create.mutateAsync({
          ...personal,
          nationalId: nationalIdDigits(values.nationalId),
          bankAccount: {
            cbu: cbuDigits(account.cbu) || null,
            alias: account.alias.trim() || null,
            bankName: account.bankName.trim() || null,
            holder: account.holder.trim() || null,
          },
        })
        toast.success("Propietario creado.")
        router.push(`/propietarios/${saved.id}`)
      }
    } catch (cause) {
      if (!applyApiErrors(cause, form.setError)) {
        setError(apiErrorMessage(cause, "No se pudo guardar el propietario."))
      }
    }
  }

  const backHref = editing ? `/propietarios/${owner.id}` : "/propietarios"

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          {editing ? owner.fullName : "Propietarios"}
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {editing ? "Editar propietario" : "Nuevo propietario"}
        </h1>
      </div>

      <form
        id="owner-form"
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
                  <FieldLabel htmlFor="owner-nationalId">DNI o CUIT</FieldLabel>
                  <Input
                    {...field}
                    id="owner-nationalId"
                    inputMode="numeric"
                    aria-invalid={invalid}
                    aria-describedby="owner-nationalId-hint"
                  />
                  {takenBy ? (
                    <p
                      id="owner-nationalId-hint"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      Ya está cargado:{" "}
                      <Link
                        href={`/propietarios/${takenBy.id}`}
                        className="underline"
                      >
                        {takenBy.fullName}
                      </Link>
                      .
                    </p>
                  ) : fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription id="owner-nationalId-hint">
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
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="owner-notes">
                  Observaciones internas
                </FieldLabel>
                <Textarea
                  {...field}
                  id="owner-notes"
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

        {editing ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            La cuenta bancaria se cambia desde la ficha, con su propia acción:
            cada cambio queda registrado aparte.
          </p>
        ) : (
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 font-display text-lg font-semibold">
              Cuenta bancaria{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (opcional, se puede cargar después)
              </span>
            </legend>
            <BankAccountFields
              form={form}
              prefix="bankAccount"
              sharedWith={cbuSharedWith}
            />
          </fieldset>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href={backHref}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Guardando…"
              : editing
                ? "Guardar"
                : "Crear propietario"}
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
  const id = `owner-${name}`
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
