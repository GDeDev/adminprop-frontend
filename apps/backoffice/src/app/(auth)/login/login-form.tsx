"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import {
  apiErrorMessage,
  safeNextPath,
  useSession,
} from "@adminprop/session/client"
import type { ApiSuccess, AuthResult } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"

import { apiClient } from "@/lib/api-client"
import { HOME_PATH } from "@/lib/session"

/**
 * En el login sólo se valida que haya algo: las reglas de contraseña son para
 * cuando se define una. Aplicarlas acá le contaría a cualquiera cómo son las
 * contraseñas válidas.
 */
const loginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const { signIn } = useSession()
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    setError(null)
    try {
      // Directo a la API (no por el servidor de Next): el límite de intentos
      // de la API es por IP y tiene que ver la de cada usuario.
      const { data } = await apiClient.post<ApiSuccess<AuthResult>>(
        "/auth/login",
        values,
        { skipAuthRefresh: true }
      )
      await signIn(data.data)
      const next = new URLSearchParams(window.location.search).get("next")
      router.replace(safeNextPath(next, HOME_PATH))
      // El layout (server) lee la marca de la inmobiliaria de la cookie nueva.
      router.refresh()
    } catch (cause) {
      setError(apiErrorMessage(cause, "No se pudo iniciar sesión."))
      form.resetField("password")
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <Input
                {...field}
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
              <Input
                {...field}
                id="login-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Ingresando…" : "Ingresar"}
        </Button>
      </FieldGroup>
    </form>
  )
}
