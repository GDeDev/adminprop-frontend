"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ImageUp, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type {
  TenantSettings,
  UpdateTenantSettingsRequest,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Textarea } from "@adminprop/ui/components/textarea"

import {
  useRemoveTenantLogo,
  useTenantSettings,
  useUpdateTenantSettings,
  useUploadTenantLogo,
} from "@/lib/tenant-settings-api"

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const LOGO_MAX_BYTES = 2 * 1024 * 1024

type TextField =
  | "legalName"
  | "taxId"
  | "address"
  | "phone"
  | "email"
  | "whatsapp"
  | "bankAccountHolder"
  | "bankName"
  | "bankCbu"
  | "bankAlias"
  | "documentFooter"

const TEXT_FIELDS: {
  key: TextField
  label: string
  hint?: string
  multiline?: boolean
}[] = [
  { key: "legalName", label: "Razón social" },
  { key: "taxId", label: "CUIT", hint: "Sale en el pie de los PDF." },
  { key: "address", label: "Dirección" },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Email de contacto" },
  {
    key: "whatsapp",
    label: "WhatsApp",
    hint: "Sólo dígitos con código de país, ej. 5491155551234. Lo ven inquilinos y propietarios en el portal.",
  },
  { key: "bankAccountHolder", label: "Titular de la cuenta" },
  { key: "bankName", label: "Banco" },
  { key: "bankCbu", label: "CBU", hint: "22 dígitos." },
  { key: "bankAlias", label: "Alias" },
  {
    key: "documentFooter",
    label: "Pie de los documentos",
    hint: "Texto legal opcional al final de recibos y liquidaciones.",
    multiline: true,
  },
]

/** Configuración → Inmobiliaria (rediseño Fase 15, sección 5). Sólo administradores. */
export function AgencySettingsScreen() {
  const { user } = useSession()
  const settings = useTenantSettings()

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        title="Sólo para administradores"
        description="Los datos de la inmobiliaria los edita un administrador."
      />
    )
  }
  if (settings.isPending) return <PageSkeleton />
  if (settings.isError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          No se pudieron cargar los datos de la inmobiliaria.
        </AlertDescription>
      </Alert>
    )
  }
  return <SettingsForm settings={settings.data} />
}

function SettingsForm({ settings }: { settings: TenantSettings }) {
  const update = useUpdateTenantSettings()
  const [values, setValues] = React.useState(() => toForm(settings))
  const [colorError, setColorError] = React.useState<string | null>(null)
  const color = values.primaryColor ?? ""

  function set(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (values.primaryColor && !HEX_COLOR.test(color)) {
      setColorError("Usá el formato #rrggbb, por ejemplo #c2410c.")
      return
    }
    setColorError(null)
    const body: Record<string, string | null> = {}
    for (const [key, value] of Object.entries(values)) {
      body[key] = value.trim() === "" ? null : value.trim()
    }
    // El nombre comercial no se puede borrar.
    body.name = (values.name ?? "").trim() || settings.name
    try {
      await update.mutateAsync(body as UpdateTenantSettingsRequest)
      toast.success("Datos de la inmobiliaria guardados.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudieron guardar los datos."))
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/configuracion">
            <ChevronLeft aria-hidden />
            Configuración
          </Link>
        </Button>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Inmobiliaria
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos que salen en los PDF (recibos, liquidaciones, rescisiones) y en
          los portales. Próximo recibo: n.º {settings.receiptSequence + 1}.
        </p>
      </div>

      <LogoSection settings={settings} />

      <form onSubmit={(event) => void save(event)} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="agency-name">Nombre comercial</FieldLabel>
            <Input
              id="agency-name"
              value={values.name ?? ""}
              onChange={(event) => set("name", event.target.value)}
            />
          </Field>
          <Field data-invalid={colorError !== null}>
            <FieldLabel htmlFor="agency-color">Color de marca</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Elegir color"
                className="h-9 w-12 cursor-pointer rounded-md border bg-transparent"
                value={HEX_COLOR.test(color) ? color : "#c2410c"}
                onChange={(event) => set("primaryColor", event.target.value)}
              />
              <Input
                id="agency-color"
                value={color}
                placeholder="#c2410c"
                aria-invalid={colorError !== null}
                onChange={(event) => set("primaryColor", event.target.value)}
              />
            </div>
            <FieldDescription>
              {colorError ??
                "Encabezados de los PDF y color principal de las pantallas."}
            </FieldDescription>
          </Field>
          {TEXT_FIELDS.map((field) => (
            <Field key={field.key}>
              <FieldLabel htmlFor={`agency-${field.key}`}>
                {field.label}
              </FieldLabel>
              {field.multiline ? (
                <Textarea
                  id={`agency-${field.key}`}
                  rows={3}
                  value={values[field.key] ?? ""}
                  onChange={(event) => set(field.key, event.target.value)}
                />
              ) : (
                <Input
                  id={`agency-${field.key}`}
                  value={values[field.key] ?? ""}
                  onChange={(event) => set(field.key, event.target.value)}
                />
              )}
              {field.hint && <FieldDescription>{field.hint}</FieldDescription>}
            </Field>
          ))}
        </FieldGroup>
        <div className="mt-6">
          <Button type="submit" disabled={update.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </div>
  )
}

function LogoSection({ settings }: { settings: TenantSettings }) {
  const upload = useUploadTenantLogo()
  const remove = useRemoveTenantLogo()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState<string | null>(null)

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function onFile(file: File | undefined) {
    if (!file) return
    if (file.size > LOGO_MAX_BYTES) {
      toast.error("El logo pesa más de 2 MB.")
      return
    }
    setPreview(URL.createObjectURL(file))
    try {
      await upload.mutateAsync(file)
      toast.success("Logo actualizado.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo subir el logo."))
    } finally {
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function removeLogo() {
    try {
      await remove.mutateAsync()
      toast.success("Logo eliminado.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo eliminar el logo."))
    }
  }

  const shown = preview ?? settings.logoUrl
  return (
    <section className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt="Logo de la inmobiliaria"
            className="max-h-full"
          />
        ) : (
          <span className="text-xs text-muted-foreground">Sin logo</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          PNG, JPG, WebP o SVG de hasta 2 MB. Sale en el encabezado de los PDF.
        </p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            id="agency-logo"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <ImageUp aria-hidden />
            {settings.logoUrl ? "Cambiar logo" : "Subir logo"}
          </Button>
          {settings.logoUrl && (
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => void removeLogo()}
            >
              <Trash2 aria-hidden />
              Quitar
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

function toForm(settings: TenantSettings): Record<string, string> {
  const values: Record<string, string> = {
    name: settings.name,
    primaryColor: settings.primaryColor ?? "",
  }
  for (const field of TEXT_FIELDS) {
    values[field.key] = (settings[field.key] as string | null) ?? ""
  }
  return values
}
