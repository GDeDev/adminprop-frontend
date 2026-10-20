"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { apiErrorMessage, apiFieldErrors } from "@adminprop/session/client"
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

const schema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre.").max(120),
  icon: z
    .string()
    .trim()
    .max(50)
    .regex(
      /^([a-z0-9]+(-[a-z0-9]+)*)?$/,
      "Usá un nombre como car o arrow-up-down."
    )
    .optional(),
})

export type NameDialogValues = z.infer<typeof schema>

/**
 * Alta rápida y edición de un maestro (spec Fase 5, 6: "modal / bottom
 * sheet"): un nombre y, para amenities, el ícono.
 */
export function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  initial,
  withIcon = false,
  submitLabel,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  initial?: { name: string; icon?: string | null }
  withIcon?: boolean
  submitLabel: string
  /** Si tira, se muestra el error de la API en el diálogo. */
  onSubmit: (values: { name: string; icon: string | null }) => Promise<void>
}) {
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<NameDialogValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: initial?.name ?? "", icon: initial?.icon ?? "" },
  })

  async function submit(values: NameDialogValues) {
    setError(null)
    try {
      await onSubmit({ name: values.name, icon: values.icon || null })
      onOpenChange(false)
    } catch (cause) {
      const fields = apiFieldErrors(cause)
      if (fields.name) form.setError("name", { message: fields.name })
      else if (fields.icon) form.setError("icon", { message: fields.icon })
      else setError(apiErrorMessage(cause, "No se pudo guardar."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          {description && (
            <ResponsiveDialogDescription>
              {description}
            </ResponsiveDialogDescription>
          )}
        </ResponsiveDialogHeader>
        <form
          id="name-dialog-form"
          onSubmit={form.handleSubmit(submit)}
          noValidate
          className="px-4 md:px-0"
        >
          <FieldGroup>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="master-name">Nombre</FieldLabel>
                  <Input
                    {...field}
                    id="master-name"
                    autoComplete="off"
                    autoFocus
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {withIcon && (
              <Controller
                name="icon"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="master-icon">
                      Ícono (opcional)
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id="master-icon"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>
                        Nombre de un ícono de lucide.dev, por ejemplo waves o
                        car.
                      </FieldDescription>
                    )}
                  </Field>
                )}
              />
            )}
          </FieldGroup>
        </form>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="name-dialog-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Guardando…" : submitLabel}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
