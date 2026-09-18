"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import type { PortalRole } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"

const portalLoginSchema = z.object({
  username: z.string().trim().min(1, "Ingresá tu usuario."),
  password: z.string().min(1, "Ingresá tu contraseña."),
})

type PortalLoginValues = z.infer<typeof portalLoginSchema>

const HOME_BY_ROLE: Record<PortalRole, string> = {
  owner: "/propietario/propiedades",
  renter: "/inquilino/cuenta",
}

/** Login de portal (propietario/inquilino). Auth real: Fase 4, POST /auth/portal-login. */
export function PortalLoginForm({ role }: { role: PortalRole }) {
  const router = useRouter()
  const form = useForm<PortalLoginValues>({
    resolver: zodResolver(portalLoginSchema),
    defaultValues: { username: "", password: "" },
  })

  async function onSubmit(values: PortalLoginValues) {
    // TODO(Fase 4): apiClient.post("/auth/portal-login", { ...values, type: role })
    void values
    await new Promise((resolve) => setTimeout(resolve, 400))
    router.push(HOME_BY_ROLE[role])
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="portal-username">Usuario</FieldLabel>
              <Input
                {...field}
                id="portal-username"
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
