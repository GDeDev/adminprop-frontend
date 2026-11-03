"use client"

import * as React from "react"
import { Check, Clock, Copy, Loader2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { apiErrorCode, apiErrorMessage } from "@adminprop/session/client"
import type { SiteSettings } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"

import {
  useSiteDomain,
  useSubdomainAvailability,
  useUpdateSiteSettings,
  useVerifySiteDomain,
} from "@/lib/site-api"
import {
  isValidSubdomainFormat,
  normalizeDomainInput,
  normalizeSubdomainInput,
} from "@/lib/site"
import { useDebouncedValue } from "@/lib/use-debounced-value"

/** Destino del CNAME que hay que cargar en el DNS (lo define cada despliegue). */
const DNS_TARGET = process.env.NEXT_PUBLIC_SITES_DNS_TARGET

/**
 * Subdominio y dominio propio. Se guardan al instante (no pasan por el
 * borrador ni por "Publicar"), cada uno con su propio botón.
 */
export function DomainTab({ settings }: { settings: SiteSettings }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SubdomainCard settings={settings} />
      <CustomDomainCard settings={settings} />
      <p className="text-sm text-muted-foreground lg:col-span-2">
        La dirección se cambia en el momento: no hace falta guardar el borrador
        ni publicar. Si el sitio ya está publicado, la dirección nueva empieza a
        funcionar enseguida.
      </p>
    </div>
  )
}

function SubdomainCard({ settings }: { settings: SiteSettings }) {
  const update = useUpdateSiteSettings()
  const current = settings.subdomain ?? ""
  const [value, setValue] = React.useState(current)
  const [conflict, setConflict] = React.useState<string | null>(null)
  const normalized = normalizeSubdomainInput(value)
  const debounced = useDebouncedValue(normalized, 400)
  const changed = normalized !== current
  const formatOk = normalized === "" || isValidSubdomainFormat(normalized)
  // Se consulta cuando el valor dejó de cambiar y es distinto del actual.
  const settled = debounced === normalized
  const availability = useSubdomainAvailability(
    debounced,
    changed && formatOk && normalized !== "" && settled
  )
  const checking =
    changed &&
    formatOk &&
    normalized !== "" &&
    (!settled || availability.isFetching)
  const available =
    changed && settled && availability.data?.value === normalized
      ? availability.data
      : null

  async function save(next: string | null) {
    setConflict(null)
    try {
      await update.mutateAsync({ subdomain: next })
      if (next === null) setValue("")
      toast.success(
        next === null ? "Quitamos el subdominio." : "Subdominio guardado."
      )
    } catch (cause) {
      if (apiErrorCode(cause) === "SUBDOMAIN_TAKEN") {
        setConflict("Ese subdominio ya está en uso. Probá con otro.")
      } else {
        toast.error(apiErrorMessage(cause, "No se pudo guardar el subdominio."))
      }
    }
  }

  const formatError = !formatOk
    ? "Usá solo minúsculas, números y guiones (sin espacios ni guiones al principio o al final)."
    : null
  const unavailable = available && !available.available
  const message =
    conflict ??
    formatError ??
    (unavailable
      ? (available.reason ?? "Ese subdominio no está disponible.")
      : null)
  const canSave =
    changed &&
    normalized !== "" &&
    formatOk &&
    available?.available === true &&
    !update.isPending

  return (
    <section
      aria-labelledby="site-subdomain-title"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <h2
        id="site-subdomain-title"
        className="font-display text-lg font-semibold"
      >
        Subdominio
      </h2>
      <Field data-invalid={message ? true : undefined}>
        <FieldLabel htmlFor="site-subdomain">Nombre del subdominio</FieldLabel>
        <Input
          id="site-subdomain"
          value={value}
          placeholder="tu-inmobiliaria"
          autoComplete="off"
          spellCheck={false}
          maxLength={63}
          aria-invalid={message ? true : undefined}
          onChange={(event) => {
            setConflict(null)
            setValue(event.target.value)
          }}
        />
        <FieldDescription>
          Es la dirección gratuita de tu sitio. Solo minúsculas, números y
          guiones.
        </FieldDescription>
        <div aria-live="polite" className="min-h-5 text-sm">
          {checking && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Verificando…
            </span>
          )}
          {!checking && available?.available && (
            <span className="inline-flex items-center gap-1.5 text-success">
              <Check aria-hidden className="size-4" />
              Está disponible.
            </span>
          )}
          {!checking && message && (
            <span className="inline-flex items-start gap-1.5 text-destructive">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {message}
            </span>
          )}
        </div>
        {availability.isError && changed && formatOk && normalized !== "" && (
          <FieldError
            errors={[
              {
                message: apiErrorMessage(
                  availability.error,
                  "No pudimos verificar si está disponible."
                ),
              },
            ]}
          />
        )}
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!canSave}
          onClick={() => void save(normalized)}
        >
          {update.isPending ? "Guardando…" : "Guardar subdominio"}
        </Button>
        {current !== "" && (
          <Button
            type="button"
            variant="ghost"
            disabled={update.isPending}
            onClick={() => void save(null)}
          >
            Quitar subdominio
          </Button>
        )}
      </div>
    </section>
  )
}

function CustomDomainCard({ settings }: { settings: SiteSettings }) {
  const update = useUpdateSiteSettings()
  const current = settings.customDomain ?? ""
  const [value, setValue] = React.useState(current)
  const [conflict, setConflict] = React.useState<string | null>(null)
  const normalized = normalizeDomainInput(value)
  const validFormat =
    normalized === "" ||
    /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(
      normalized
    )
  const changed = normalized !== current

  async function save(next: string | null) {
    setConflict(null)
    try {
      await update.mutateAsync({ customDomain: next })
      if (next === null) setValue("")
      toast.success(
        next === null ? "Quitamos el dominio propio." : "Dominio guardado."
      )
    } catch (cause) {
      if (apiErrorCode(cause) === "DOMAIN_TAKEN") {
        setConflict("Ese dominio ya fue verificado por otra inmobiliaria.")
      } else {
        toast.error(apiErrorMessage(cause, "No se pudo guardar el dominio."))
      }
    }
  }

  const message =
    conflict ??
    (!validFormat
      ? "Escribí el dominio completo, por ejemplo www.tuinmobiliaria.com.ar."
      : null)

  return (
    <section
      aria-labelledby="site-domain-title"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <h2 id="site-domain-title" className="font-display text-lg font-semibold">
        Dominio propio
      </h2>
      <Field data-invalid={message ? true : undefined}>
        <FieldLabel htmlFor="site-custom-domain">Nombre del dominio</FieldLabel>
        <Input
          id="site-custom-domain"
          value={value}
          placeholder="www.tuinmobiliaria.com.ar"
          autoComplete="off"
          spellCheck={false}
          inputMode="url"
          aria-invalid={message ? true : undefined}
          onChange={(event) => {
            setConflict(null)
            setValue(event.target.value)
          }}
        />
        <FieldDescription>
          Opcional. Sin «https://» ni barras. Lo guardamos tal cual lo escribas.
        </FieldDescription>
        {message && <FieldError errors={[{ message }]} />}
      </Field>

      <DomainVerification hasUnsavedChange={changed} />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={
            !changed || normalized === "" || !validFormat || update.isPending
          }
          onClick={() => void save(normalized)}
        >
          {update.isPending ? "Guardando…" : "Guardar dominio"}
        </Button>
        {current !== "" && (
          <Button
            type="button"
            variant="ghost"
            disabled={update.isPending}
            onClick={() => void save(null)}
          >
            Quitar dominio
          </Button>
        )}
      </div>
    </section>
  )
}

/**
 * Estado del dominio guardado y cómo demostrar que es propio. Hasta que se
 * verifica con un registro TXT, el dominio está reservado pero el sitio no
 * responde ahí (así nadie puede reservar el dominio de otro).
 */
function DomainVerification({
  hasUnsavedChange,
}: {
  hasUnsavedChange: boolean
}) {
  const domain = useSiteDomain()
  const verify = useVerifySiteDomain()
  const [message, setMessage] = React.useState<string | null>(null)

  if (domain.isPending) {
    return (
      <p
        className="flex items-center gap-2 text-sm text-muted-foreground"
        role="status"
      >
        <Loader2 aria-hidden className="size-4 animate-spin" />
        Buscando el estado del dominio…
      </p>
    )
  }
  if (domain.isError || !domain.data) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription className="flex flex-wrap items-center gap-2">
          No pudimos ver el estado del dominio.
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void domain.refetch()}
          >
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const { customDomain, verified, record, verificationRequired } = domain.data
  if (!customDomain) {
    return (
      <p className="text-sm text-muted-foreground">
        Cargá tu dominio y te damos un registro DNS para demostrar que es tuyo.
      </p>
    )
  }

  async function onVerify() {
    setMessage(null)
    try {
      await verify.mutateAsync()
      toast.success("Dominio verificado: tu sitio ya responde ahí.")
    } catch (cause) {
      const code = apiErrorCode(cause)
      if (code === "DOMAIN_NOT_VERIFIED") {
        setMessage(
          apiErrorMessage(cause, "Todavía no encontramos el registro.")
        )
      } else if (code === "DOMAIN_TAKEN") {
        setMessage("Otra inmobiliaria verificó ese dominio primero.")
      } else {
        toast.error(apiErrorMessage(cause, "No se pudo verificar el dominio."))
      }
    }
  }

  if (verified || !verificationRequired) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm"
      >
        <Check aria-hidden className="size-4 shrink-0" />
        <span>
          <strong>{customDomain}</strong> está verificado.
          {DNS_TARGET ? (
            <>
              {" "}
              Para que el sitio responda ahí, creá un registro{" "}
              <strong>CNAME</strong> hacia{" "}
              <code className="break-all">{DNS_TARGET}</code>.
            </>
          ) : (
            <>
              {" "}
              Para que responda ahí, pedile al equipo de Adminprop el destino
              del CNAME.
            </>
          )}
        </span>
      </p>
    )
  }

  return (
    <Alert>
      <AlertDescription className="flex flex-col gap-3">
        <span className="flex items-center gap-2 font-medium">
          <Clock aria-hidden className="size-4" />
          Falta verificar {customDomain}
        </span>
        <p>
          Mientras no lo verifiques, el dominio queda reservado pero el sitio no
          responde ahí. Para demostrar que es tuyo, cargá este registro
          <strong> TXT</strong> en el DNS de tu dominio:
        </p>
        {record && (
          <dl className="grid gap-2 text-sm">
            <CopyRow label="Nombre (host)" value={record.host} />
            <CopyRow label="Valor" value={record.value} />
          </dl>
        )}
        <p className="text-muted-foreground">
          Los cambios de DNS pueden tardar un rato en propagarse (a veces hasta
          unas horas). Cuando lo cargues, tocá «Verificar dominio».
        </p>
        {message && (
          <p role="alert" className="flex items-start gap-2 text-destructive">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {message}
          </p>
        )}
        <div>
          <Button
            type="button"
            disabled={verify.isPending || hasUnsavedChange}
            onClick={() => void onVerify()}
          >
            {verify.isPending ? "Verificando…" : "Verificar dominio"}
          </Button>
          {hasUnsavedChange && (
            <span className="ml-3 text-sm text-muted-foreground">
              Primero guardá el dominio que escribiste.
            </span>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

function CopyRow({ label, value }: { label: string; value: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success("Copiado.")
    } catch {
      toast.error("No pudimos copiar: seleccionalo a mano.")
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2">
        <code className="min-w-0 flex-1 rounded bg-muted px-2 py-1.5 break-all">
          {value}
        </code>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={`Copiar ${label.toLowerCase()}`}
          onClick={() => void copy()}
        >
          <Copy aria-hidden className="size-4" />
        </Button>
      </dd>
    </div>
  )
}
