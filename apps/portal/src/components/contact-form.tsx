"use client"

import * as React from "react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { PublicContactRequest } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { Input } from "@adminprop/ui/components/input"
import { Textarea } from "@adminprop/ui/components/textarea"

import { apiClient } from "@/lib/api-client"

type Outcome = "sent" | "unavailable" | null

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
  const [outcome, setOutcome] = React.useState<Outcome>(null)

  function set(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!values.name.trim() || !values.email.trim() || !values.message.trim()) {
      setError("Completá tu nombre, tu email y el mensaje.")
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
      const message = apiErrorMessage(cause, "")
      if (message.toLowerCase().includes("disponible")) {
        setOutcome("unavailable")
      } else {
        setError(
          message || "No pudimos enviar tu consulta. Probá de nuevo en un rato."
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
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised"
      aria-label="Consultar por esta propiedad"
    >
      <h2 className="font-display text-lg font-semibold">Consultar</h2>
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <Input
            autoComplete="name"
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <Input
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Teléfono
          <Input
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Mensaje
        <Textarea
          rows={4}
          value={values.message}
          onChange={(event) => set("message", event.target.value)}
        />
      </label>
      {/* Honeypot: fuera de pantalla y fuera del orden de tabulación. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          No completar
          <input
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
