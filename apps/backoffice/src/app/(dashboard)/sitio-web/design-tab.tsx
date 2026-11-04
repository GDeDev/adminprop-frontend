"use client"

import { Check, TriangleAlert } from "lucide-react"

import type { SiteTemplateInfo, SiteTheme } from "@adminprop/shared-types"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import { cn } from "@adminprop/ui/lib/utils"

import {
  THEME_RADII,
  formatRatio,
  isHexColor,
  themeContrastChecks,
} from "@/lib/site"

import { SELECT_CLASS, fieldId, useClearError, useFieldError } from "./fields"
import { TemplateMockup } from "./template-mockup"

type ColorKey = "primary" | "secondary" | "background" | "surface" | "text"

const COLORS: { key: ColorKey; label: string; hint: string }[] = [
  { key: "primary", label: "Color principal", hint: "Botones y acentos" },
  {
    key: "secondary",
    label: "Color secundario",
    hint: "Detalles y títulos chicos",
  },
  { key: "background", label: "Fondo", hint: "Color de toda la página" },
  {
    key: "surface",
    label: "Tarjetas",
    hint: "Fondo de las tarjetas y bloques",
  },
  { key: "text", label: "Texto", hint: "Color de los textos" },
]

const RADIUS_LABELS: Record<number, string> = {
  0: "Rectas",
  8: "Suaves",
  16: "Redondeadas",
  24: "Muy redondeadas",
}

function ColorField({
  colorKey,
  label,
  hint,
  value,
  onChange,
}: {
  colorKey: ColorKey
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
}) {
  const path = `theme.${colorKey}`
  const id = fieldId(path)
  const clear = useClearError()
  const serverError = useFieldError(path)
  const invalid = !isHexColor(value)
  const error =
    serverError ??
    (invalid ? "Usá el formato #RRGGBB, por ejemplo #1F2937." : null)

  function handle(next: string) {
    clear(path)
    const trimmed = next.trim()
    onChange(
      trimmed !== "" && !trimmed.startsWith("#") ? `#${trimmed}` : trimmed
    )
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`Elegir ${label.toLowerCase()}`}
          value={invalid ? "#000000" : value.toLowerCase()}
          onChange={(event) => handle(event.target.value)}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-md border bg-background p-1 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:h-9"
        />
        <Input
          id={id}
          value={value}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          className="font-mono uppercase"
          onChange={(event) => handle(event.target.value)}
        />
      </div>
      <FieldDescription>{hint}</FieldDescription>
      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  )
}

export function DesignTab({
  theme,
  template,
  onChange,
}: {
  theme: SiteTheme
  template: SiteTemplateInfo | undefined
  onChange: (patch: Partial<SiteTheme>) => void
}) {
  const clear = useClearError()
  const checks = themeContrastChecks(theme)
  const fontError = useFieldError("theme.fontKey")
  const radiusError = useFieldError("theme.radius")
  const fonts = template?.fontOptions ?? []
  // Si el tema trae una tipografía que el template no ofrece, igual se muestra.
  const fontKnown = fonts.some((f) => f.key === theme.fontKey)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-raised">
          <h2 className="font-display text-title-md font-semibold">Colores</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {COLORS.map((color) => (
              <ColorField
                key={color.key}
                colorKey={color.key}
                label={color.label}
                hint={color.hint}
                value={theme[color.key]}
                onChange={(value) => onChange({ [color.key]: value })}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-raised">
          <h2 className="font-display text-title-md font-semibold">
            Tipografía
          </h2>
          <Field data-invalid={fontError ? true : undefined}>
            <FieldLabel htmlFor={fieldId("theme.fontKey")}>Fuente</FieldLabel>
            <select
              id={fieldId("theme.fontKey")}
              value={theme.fontKey}
              className={SELECT_CLASS}
              aria-invalid={fontError ? true : undefined}
              onChange={(event) => {
                clear("theme.fontKey")
                onChange({ fontKey: event.target.value })
              }}
            >
              {!fontKnown && (
                <option value={theme.fontKey}>{theme.fontKey}</option>
              )}
              {fonts.map((font) => (
                <option key={font.key} value={font.key}>
                  {font.label}
                </option>
              ))}
            </select>
            <FieldDescription>
              Las opciones dependen del template elegido.
            </FieldDescription>
            {fontError && <FieldError errors={[{ message: fontError }]} />}
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-raised">
          <h2 className="font-display text-title-md font-semibold">Esquinas</h2>
          <div
            role="radiogroup"
            aria-label="Esquinas"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {THEME_RADII.map((radius) => {
              const selected = theme.radius === radius
              return (
                <button
                  key={radius}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    clear("theme.radius")
                    onChange({ radius })
                  }}
                  className={cn(
                    "flex min-h-11 flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                    selected && "border-primary bg-muted font-medium"
                  )}
                >
                  <span
                    aria-hidden
                    className="h-8 w-12 border-2 border-foreground/60"
                    style={{ borderRadius: radius }}
                  />
                  <span>
                    {RADIUS_LABELS[radius]} ({radius})
                  </span>
                  {selected && <Check aria-hidden className="size-4" />}
                </button>
              )
            })}
          </div>
          {radiusError && <FieldError errors={[{ message: radiusError }]} />}
        </section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <section
          aria-labelledby="site-contrast-title"
          className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised"
        >
          <h2
            id="site-contrast-title"
            className="font-display text-title-md font-semibold"
          >
            Legibilidad (AA)
          </h2>
          <ul className="flex flex-col gap-2" aria-live="polite">
            {checks.map((check) => (
              <li
                key={check.id}
                className={cn(
                  "flex items-start gap-2 text-sm",
                  !check.passes && "text-destructive"
                )}
              >
                {check.passes ? (
                  <Check
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-success"
                  />
                ) : (
                  <TriangleAlert
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0"
                  />
                )}
                <span>
                  <span className="font-medium">{check.label}:</span>{" "}
                  {formatRatio(check.ratio)}{" "}
                  <span className="text-muted-foreground">
                    (mínimo {String(check.minimum).replace(".", ",")})
                  </span>
                  <span className="sr-only">
                    {check.passes ? ". Cumple." : ". No cumple."}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Para publicar, los tres tienen que cumplir.
          </p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Así queda</h2>
          <TemplateMockup theme={theme} />
        </section>
      </aside>
    </div>
  )
}
