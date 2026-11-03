"use client"

import * as React from "react"
import { Check, Loader2, TriangleAlert } from "lucide-react"
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

import { useSubdomainAvailability, useUpdateSiteSettings } from "@/lib/site-api"
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
        setConflict("Ese dominio ya está en uso por otra inmobiliaria.")
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

      <Alert>
        <AlertDescription className="flex flex-col gap-2">
          <span className="font-medium">
            Cómo conectarlo (en el DNS de tu dominio)
          </span>
          <ol className="ml-4 list-decimal space-y-1">
            <li>
              Entrá al panel donde compraste el dominio (donde se administran
              los registros DNS).
            </li>
            <li>
              Creá un registro <strong>CNAME</strong> para <code>www</code>{" "}
              {DNS_TARGET ? (
                <>
                  que apunte a <code className="break-all">{DNS_TARGET}</code>.
                </>
              ) : (
                <>que apunte al destino que te pase el equipo de Adminprop.</>
              )}
            </li>
            <li>
              Si querés que también funcione sin «www», pedile a tu proveedor un
              redireccionamiento hacia la versión con «www».
            </li>
            <li>
              Guardá el dominio acá. Los cambios de DNS pueden tardar hasta 24
              horas en verse.
            </li>
          </ol>
          <span className="text-muted-foreground">
            Guardar el dominio no lo conecta solo: el DNS lo cargás vos.
          </span>
        </AlertDescription>
      </Alert>

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
