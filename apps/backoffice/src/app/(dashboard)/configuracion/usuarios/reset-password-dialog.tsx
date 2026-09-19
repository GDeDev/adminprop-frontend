"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { apiErrorMessage } from "@adminprop/session/client"
import type { User } from "@adminprop/shared-types"
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

import { PASSWORD_HINT, strongPassword } from "@/lib/password-rules"
import { displayName } from "@/lib/users"
import { useResetUserPassword } from "@/lib/users-api"

const schema = z.object({ newPassword: strongPassword })

/** Un admin le pone una contraseña nueva a otro usuario (el que se la olvidó). */
export function ResetPasswordDialog({
  user,
  onOpenChange,
}: {
  user: User | null
  onOpenChange: (open: boolean) => void
}) {
  const reset = useResetUserPassword()
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "" },
  })

  async function onSubmit({ newPassword }: z.infer<typeof schema>) {
    if (!user) return
    setError(null)
    try {
      await reset.mutateAsync({ id: user.id, newPassword })
      toast.success(
        "Contraseña actualizada. Se cerraron sus sesiones abiertas."
      )
      onOpenChange(false)
    } catch (cause) {
      setError(apiErrorMessage(cause, "No se pudo cambiar la contraseña."))
    }
  }

  return (
    <ResponsiveDialog open={user !== null} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Resetear contraseña</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {user &&
              `Nueva contraseña para ${displayName(user)}. Se le cierran todas las sesiones y se le desbloquea la cuenta.`}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          id="reset-password-form"
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
            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password">
                    Contraseña nueva
                  </FieldLabel>
                  <Input
                    {...field}
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>{PASSWORD_HINT}</FieldDescription>
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
            form="reset-password-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Guardando…" : "Cambiar contraseña"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
