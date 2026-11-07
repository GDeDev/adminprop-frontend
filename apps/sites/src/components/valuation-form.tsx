"use client"

import { useId, useState, type ReactNode } from "react"

import { cn } from "@/lib/cn"
import {
  buildValuationMessage,
  validateValuation,
  VALUATION_OPERATIONS,
  VALUATION_PROPERTY_TYPES,
  type ValuationInput,
} from "@/lib/valuation-request"

type Status = "idle" | "sending" | "sent" | "error"

const FIELD =
  "min-h-11 w-full rounded-site border border-site-border bg-site-bg px-3 py-2 text-site-text placeholder:text-site-muted"

/**
 * Formulario «Tasá tu propiedad». Manda la solicitud al mismo endpoint del
 * formulario de contacto (`<base>/api/contacto`): para la API es una consulta
 * más, con el detalle de la propiedad armado como texto plano en el mensaje.
 */
export function ValuationForm({
  base,
  disabled = false,
  className,
}: {
  base: string
  /** En la vista previa del editor no envía nada. */
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled || status === "sending") return
    const form = event.currentTarget
    const data = new FormData(form)
    const text = (name: string) => String(data.get(name) ?? "")

    const valuation: ValuationInput = {
      propertyType: text("propertyType"),
      operation: text("operation"),
      address: text("address"),
      areaM2: text("areaM2"),
      bedrooms: text("bedrooms"),
      notes: text("notes"),
    }
    const found: Record<string, string> = { ...validateValuation(valuation) }
    const name = text("name").trim()
    const email = text("email").trim()
    if (!name) found.name = "Contanos tu nombre."
    if (!/^\S+@\S+\.\S+$/.test(email)) found.email = "Escribí un email válido."
    setErrors(found)
    if (Object.keys(found).length > 0) {
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
        body: JSON.stringify({
          name,
          email,
          phone: text("phone").trim(),
          message: buildValuationMessage(valuation),
          website: text("website"),
          propertyId: null,
        }),
      })
      const result = (await response.json().catch(() => ({}))) as {
        message?: string
      }
      if (!response.ok) {
        setStatus("error")
        setMessage(
          result.message ??
            "No pudimos enviar tu solicitud. Probá de nuevo en un momento."
        )
        return
      }
      form.reset()
      setStatus("sent")
    } catch {
      setStatus("error")
      setMessage(
        "No pudimos enviar tu solicitud. Revisá tu conexión e intentá de nuevo."
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
        <p className="text-lg font-semibold">¡Recibimos tu solicitud!</p>
        <p className="text-site-muted mt-2">
          Un asesor te va a contactar para coordinar la tasación.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 min-h-11 px-4 underline underline-offset-4"
        >
          Tasar otra propiedad
        </button>
      </div>
    )
  }

  const field = (
    name: string,
    label: ReactNode,
    control: (props: {
      id: string
      "aria-invalid": boolean
      "aria-describedby": string | undefined
    }) => ReactNode
  ) => {
    const fieldId = `${id}-${name}`
    const errorId = `${fieldId}-error`
    return (
      <div>
        <label htmlFor={fieldId} className="mb-1 block text-sm font-medium">
          {label}
        </label>
        {control({
          id: fieldId,
          "aria-invalid": Boolean(errors[name]),
          "aria-describedby": errors[name] ? errorId : undefined,
        })}
        {errors[name] && (
          <p id={errorId} className="mt-1 text-sm underline decoration-wavy">
            {errors[name]}
          </p>
        )}
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Solicitud de tasación"
      className={cn("grid gap-4", className)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {field("propertyType", "Tipo de propiedad", (props) => (
          <select
            {...props}
            name="propertyType"
            defaultValue=""
            required
            className={FIELD}
          >
            <option value="" disabled>
              Elegí una opción
            </option>
            {VALUATION_PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        ))}
        {field("operation", "¿Qué querés hacer?", (props) => (
          <select
            {...props}
            name="operation"
            defaultValue=""
            required
            className={FIELD}
          >
            <option value="" disabled>
              Elegí una opción
            </option>
            {VALUATION_OPERATIONS.map((operation) => (
              <option key={operation.value} value={operation.value}>
                {operation.label}
              </option>
            ))}
          </select>
        ))}
      </div>
      {field("address", "Dirección y zona", (props) => (
        <input
          {...props}
          name="address"
          autoComplete="street-address"
          maxLength={200}
          required
          placeholder="Calle y altura, barrio o localidad"
          className={FIELD}
        />
      ))}
      <div className="grid gap-4 sm:grid-cols-2">
        {field(
          "areaM2",
          <>
            Superficie en m² <span className="text-site-muted">(opcional)</span>
          </>,
          (props) => (
            <input
              {...props}
              name="areaM2"
              inputMode="decimal"
              maxLength={9}
              className={FIELD}
            />
          )
        )}
        {field(
          "bedrooms",
          <>
            Dormitorios <span className="text-site-muted">(opcional)</span>
          </>,
          (props) => (
            <input
              {...props}
              name="bedrooms"
              inputMode="numeric"
              maxLength={2}
              className={FIELD}
            />
          )
        )}
      </div>
      {field(
        "notes",
        <>
          Algo más que quieras contarnos{" "}
          <span className="text-site-muted">(opcional)</span>
        </>,
        (props) => (
          <textarea
            {...props}
            name="notes"
            rows={3}
            maxLength={600}
            className={cn(FIELD, "resize-y")}
          />
        )
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {field("name", "Nombre", (props) => (
          <input
            {...props}
            name="name"
            autoComplete="name"
            maxLength={120}
            required
            className={FIELD}
          />
        ))}
        {field("email", "Email", (props) => (
          <input
            {...props}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={200}
            required
            className={FIELD}
          />
        ))}
        {field(
          "phone",
          <>
            Teléfono <span className="text-site-muted">(opcional)</span>
          </>,
          (props) => (
            <input
              {...props}
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              className={FIELD}
            />
          )
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
            Estás en la vista previa: el formulario no envía solicitudes.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || status === "sending"}
        className="rounded-site bg-site-primary text-site-on-primary min-h-11 px-6 font-semibold disabled:opacity-60"
      >
        {status === "sending" ? "Enviando…" : "Pedir tasación"}
      </button>
    </form>
  )
}
