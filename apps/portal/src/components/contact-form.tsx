"use client"

import * as React from "react"

import { apiErrorCode, apiErrorMessage } from "@adminprop/session/client"
import type { PublicContactRequest } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { Input } from "@adminprop/ui/components/input"
import { Textarea } from "@adminprop/ui/components/textarea"

import { apiClient } from "@/lib/api-client"

// El borde `input` del tema oscuro casi no se distingue del fondo de la tarjeta.
const VISIBLE_BORDER = "dark:border-muted-foreground/50"

type Outcome = "sent" | "unavailable" | null
type FieldKey = "name" | "email" | "message"
const FIELD_ORDER: FieldKey[] = ["name", "email", "message"]

/**
 * Formulario de consulta de la ficha pública (spec Fase 22, 2.3). El campo
 * `website` es un honeypot: está oculto a las personas y los bots lo
 * completan (A-48). Si la propiedad ya no está disponible se avisa sin error crudo.
 */
export function ContactForm({
  slug,
  propertyId,
  defaultMessage,
}: {
  slug: string
  propertyId: string | null
  defaultMessage: string
}) {
  const [values, setValues] = React.useState({
    name: "",
    email: "",
    phone: "",
    message: defaultMessage,
    website: "",
  })
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<FieldKey, string>>
  >({})
  const [outcome, setOutcome] = React.useState<Outcome>(null)
  const id = React.useId()
  const errorId = (field: FieldKey) => `${id}-${field}-error`

  function set(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = event.currentTarget
    const errors: Partial<Record<FieldKey, string>> = {}
    if (!values.name.trim()) errors.name = "Contanos tu nombre."
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      errors.email = "Escribí un email válido."
    }
    if (!values.message.trim()) errors.message = "Escribí tu consulta."
    setFieldErrors(errors)
    const first = FIELD_ORDER.find((key) => errors[key])
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setBusy(true)
    try {
      const body: PublicContactRequest = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        message: values.message.trim(),
        propertyId,
        website: values.website,
      }
      await apiClient.post(`/public/${encodeURIComponent(slug)}/contact`, body)
      setOutcome("sent")
    } catch (cause) {
      if (apiErrorCode(cause) === "PROPERTY_NOT_AVAILABLE") {
        setOutcome("unavailable")
      } else {
        setError(
          apiErrorMessage(
            cause,
            "No pudimos enviar tu consulta. Probá de nuevo en un rato."
          )
        )
      }
    } finally {
      setBusy(false)
    }
  }

  if (outcome === "sent") {
    return (
      <Alert role="status">
        <AlertDescription>
          ¡Gracias! Recibimos tu consulta y te vamos a responder a la brevedad.
        </AlertDescription>
      </Alert>
    )
  }
  if (outcome === "unavailable") {
    return (
      <Alert role="status">
        <AlertDescription>
          Esta propiedad ya no está disponible. Mirá el resto del listado para
          encontrar otra.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      className="relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised"
      aria-label="Consultar por esta propiedad"
    >
      <h2 className="font-display text-title-md font-semibold">
        Enviá tu consulta
      </h2>
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <Input
              className={VISIBLE_BORDER}
              name="name"
              autoComplete="name"
              required
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? errorId("name") : undefined}
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </label>
          <FieldError id={errorId("name")} message={fieldErrors.name} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <Input
              className={VISIBLE_BORDER}
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? errorId("email") : undefined
              }
              value={values.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </label>
          <FieldError id={errorId("email")} message={fieldErrors.email} />
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Teléfono
          <Input
            className={VISIBLE_BORDER}
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-col gap-1">
        <label className="flex flex-col gap-1 text-sm">
          Mensaje
          <Textarea
            className={VISIBLE_BORDER}
            name="message"
            rows={4}
            required
            aria-invalid={Boolean(fieldErrors.message)}
            aria-describedby={
              fieldErrors.message ? errorId("message") : undefined
            }
            value={values.message}
            onChange={(event) => set("message", event.target.value)}
          />
        </label>
        <FieldError id={errorId("message")} message={fieldErrors.message} />
      </div>
      {/* Honeypot: fuera de pantalla y fuera del orden de tabulación. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          No completar
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            name="website"
            value={values.website}
            onChange={(event) => set("website", event.target.value)}
          />
        </label>
      </div>
      <div>
        <Button type="submit" disabled={busy}>
          Enviar consulta
        </Button>
      </div>
    </form>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  )
}
