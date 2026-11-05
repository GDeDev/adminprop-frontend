"use client"

import { useId, useState } from "react"

import { cn } from "@/lib/cn"

type Status = "idle" | "sending" | "sent" | "error"

const FIELD =
  "min-h-11 w-full rounded-site border border-site-border bg-site-bg px-3 py-2 text-site-text placeholder:text-site-muted"

/**
 * Formulario de contacto. Envía al propio sitio (`<base>/api/contacto`), que lo
 * reenvía a la API: así el navegador nunca habla con la API desde un dominio
 * propio de la inmobiliaria (sin CORS que mantener).
 */
export function ContactForm({
  base,
  propertyId = null,
  disabled = false,
  className,
  submitClassName,
}: {
  base: string
  propertyId?: string | null
  /** En la vista previa del editor el formulario no envía nada. */
  disabled?: boolean
  className?: string
  submitClassName?: string
}) {
  const id = useId()
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled || status === "sending") return
    const form = event.currentTarget
    const data = new FormData(form)
    const body = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      website: String(data.get("website") ?? ""),
      propertyId,
    }

    const errors: Record<string, string> = {}
    if (!body.name) errors.name = "Contanos tu nombre."
    if (!/^\S+@\S+\.\S+$/.test(body.email)) {
      errors.email = "Escribí un email válido."
    }
    if (!body.message) errors.message = "Escribí tu consulta."
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setStatus("idle")
      setMessage(null)
      return
    }

    setStatus("sending")
    setMessage(null)
    try {
      const response = await fetch(`${base}/api/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const result = (await response.json().catch(() => ({}))) as {
        message?: string
      }
      if (!response.ok) {
        setStatus("error")
        setMessage(
          result.message ??
            "No pudimos enviar tu consulta. Probá de nuevo en un momento."
        )
        return
      }
      form.reset()
      setStatus("sent")
    } catch {
      setStatus("error")
      setMessage(
        "No pudimos enviar tu consulta. Revisá tu conexión e intentá de nuevo."
      )
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        className={cn(
          "rounded-site border-site-border bg-site-surface border p-6 text-center",
          className
        )}
      >
        <p className="text-lg font-semibold">¡Gracias por escribirnos!</p>
        <p className="text-site-muted mt-2">
          Recibimos tu consulta y te vamos a responder a la brevedad.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 min-h-11 px-4 underline underline-offset-4"
        >
          Enviar otra consulta
        </button>
      </div>
    )
  }

  const errorId = (name: string) => `${id}-${name}-error`

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Formulario de contacto"
      className={cn("grid gap-4", className)}
    >
      <div>
        <label
          htmlFor={`${id}-name`}
          className="mb-1 block text-sm font-medium"
        >
          Nombre
        </label>
        <input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          maxLength={120}
          required
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? errorId("name") : undefined}
          className={FIELD}
        />
        {fieldErrors.name && (
          <p
            id={errorId("name")}
            className="text-site-text mt-1 text-sm underline decoration-wavy"
          >
            {fieldErrors.name}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${id}-email`}
            className="mb-1 block text-sm font-medium"
          >
            Email
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={200}
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? errorId("email") : undefined}
            className={FIELD}
          />
          {fieldErrors.email && (
            <p
              id={errorId("email")}
              className="mt-1 text-sm underline decoration-wavy"
            >
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor={`${id}-phone`}
            className="mb-1 block text-sm font-medium"
          >
            Teléfono <span className="text-site-muted">(opcional)</span>
          </label>
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            className={FIELD}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor={`${id}-message`}
          className="mb-1 block text-sm font-medium"
        >
          Consulta
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          maxLength={2000}
          required
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={
            fieldErrors.message ? errorId("message") : undefined
          }
          className={cn(FIELD, "resize-y")}
        />
        {fieldErrors.message && (
          <p
            id={errorId("message")}
            className="mt-1 text-sm underline decoration-wavy"
          >
            {fieldErrors.message}
          </p>
        )}
      </div>

      {/* Honeypot: una persona no lo ve ni lo completa; un bot sí. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor={`${id}-website`}>No completar este campo</label>
        <input
          id={`${id}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div aria-live="polite">
        {status === "error" && message && (
          <p
            role="alert"
            className="rounded-site border-site-border bg-site-surface border p-3"
          >
            {message}
          </p>
        )}
        {disabled && (
          <p className="rounded-site border-site-border bg-site-surface border p-3 text-sm">
            Estás en la vista previa: el formulario no envía consultas.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || status === "sending"}
        className={cn(
          "rounded-site bg-site-primary text-site-on-primary min-h-11 px-6 font-semibold disabled:opacity-60",
          submitClassName
        )}
      >
        {status === "sending" ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  )
}
