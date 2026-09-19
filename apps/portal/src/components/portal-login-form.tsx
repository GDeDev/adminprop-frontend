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
import type {
  ApiSuccess,
  AuthResult,
  PortalLoginRequest,
  PortalRole,
} from "@adminprop/shared-types"
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
import { PORTAL_AREAS } from "@/lib/session"

const portalLoginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
})

type PortalLoginValues = z.infer<typeof portalLoginSchema>

/**
 * Login de portal (spec Fase 4, 3.2). Va directo a la API con la
 * inmobiliaria del portal: el mismo email puede ser propietario en otra.
 */
export function PortalLoginForm({
  role,
  tenantSlug,
}: {
  role: PortalRole
  /** `null` si el portal no tiene inmobiliaria configurada. */
  tenantSlug: string | null
}) {
  const router = useRouter()
  const { signIn } = useSession()
  const area = PORTAL_AREAS[role]
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<PortalLoginValues>({
    resolver: zodResolver(portalLoginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: PortalLoginValues) {
    if (!tenantSlug) return
    setError(null)
    try {
      const body: PortalLoginRequest = {
        ...values,
        tenantSlug,
        type: area.apiType,
      }
      const { data } = await apiClient.post<ApiSuccess<AuthResult>>(
        "/auth/portal-login",
        body,
        { skipAuthRefresh: true }
      )
      await signIn(data.data)
      const next = new URLSearchParams(window.location.search).get("next")
      const target = safeNextPath(next, area.homePath)
      // Un `next` de la otra área no sirve con esta sesión.
      router.replace(target.startsWith(area.basePath) ? target : area.homePath)
    } catch (cause) {
      setError(apiErrorMessage(cause, "No se pudo iniciar sesión."))
      form.resetField("password")
    }
  }

  if (!tenantSlug) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          Este portal todavía no tiene una inmobiliaria configurada. Avisale a
          la inmobiliaria.
        </AlertDescription>
      </Alert>
    )
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
              <FieldLabel htmlFor="portal-email">Email</FieldLabel>
              <Input
                {...field}
                id="portal-email"
                type="email"
                inputMode="email"
                autoComplete="username"
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
              <FieldLabel htmlFor="portal-password">Contraseña</FieldLabel>
              <Input
                {...field}
                id="portal-password"
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
