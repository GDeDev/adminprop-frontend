"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, type UseFormSetError } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  apiErrorCode,
  apiErrorMessage,
  apiFieldErrors,
} from "@adminprop/session/client"
import type { InternalRole, User } from "@adminprop/shared-types"
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

import { PASSWORD_HINT, strongPassword } from "@/lib/password-rules"
import { useCreateUser, useUpdateUser } from "@/lib/users-api"

const baseSchema = z.object({
  firstName: z.string().trim().min(1, "Ingresá el nombre.").max(100),
  lastName: z.string().trim().min(1, "Ingresá el apellido.").max(100),
  email: z.email("Ingresá un email válido.").max(255),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
})

const createSchema = baseSchema.extend({ password: strongPassword })

type FormValues = z.infer<typeof baseSchema> & { password?: string }

/** Lleva al formulario los errores por campo que devolvió la API. */
function applyApiErrors(error: unknown, setError: UseFormSetError<FormValues>) {
  const fields = apiFieldErrors(error)
  for (const [field, message] of Object.entries(fields)) {
    if (field in createSchema.shape) {
      setError(field as keyof FormValues, { message })
    }
  }
  if (apiErrorCode(error) === "EMAIL_ALREADY_REGISTERED") {
    setError("email", { message: "Ya hay un usuario con ese email." })
    return true
  }
  return Object.keys(fields).length > 0
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  isSelf,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sin usuario: alta. Con usuario: edición. */
  user: User | null
  /** Editándose a sí mismo: no puede cambiarse el rol (regla de la API). */
  isSelf: boolean
}) {
  const creating = user === null
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(creating ? createSchema : baseSchema),
    defaultValues: emptyValues(user),
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      if (creating) {
        await createUser.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          role: values.role,
          password: values.password ?? "",
        })
        toast.success("Usuario creado. Pasale su contraseña inicial.")
      } else {
        await updateUser.mutateAsync({
          id: user.id,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          ...(isSelf ? {} : { role: values.role }),
        })
        toast.success("Usuario actualizado.")
      }
      onOpenChange(false)
    } catch (cause) {
      if (!applyApiErrors(cause, form.setError)) {
        setError(apiErrorMessage(cause, "No se pudo guardar el usuario."))
      }
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {creating ? "Nuevo usuario" : "Editar usuario"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {creating
              ? "Un administrador o empleado de la inmobiliaria."
              : "Los cambios de rol rigen desde su próxima acción."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          id="user-form"
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
            <TextField
              form={form}
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
            />
            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-role">Rol</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as InternalRole)
                    }
                    disabled={isSelf}
                  >
                    <SelectTrigger id="user-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelf && (
                    <FieldDescription>
                      No podés cambiar tu propio rol.
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
            {creating && (
              <TextField
                form={form}
                name="password"
                label="Contraseña inicial"
                type="password"
                autoComplete="new-password"
                description={PASSWORD_HINT}
              />
            )}
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
            form="user-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Guardando…"
              : creating
                ? "Crear usuario"
                : "Guardar"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function emptyValues(user: User | null): FormValues {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    role: user?.role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
    password: "",
  }
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
  name: "firstName" | "lastName" | "email" | "password"
  label: string
  type?: string
  autoComplete?: string
  description?: string
}) {
  const id = `user-${name}`
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            {...field}
            value={field.value ?? ""}
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
