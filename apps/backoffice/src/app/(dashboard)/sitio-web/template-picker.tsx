"use client"

import * as React from "react"
import { Check } from "lucide-react"

import type { SiteTemplateInfo, SiteTemplateKey } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { cn } from "@adminprop/ui/lib/utils"

import { TEMPLATE_THUMBNAILS } from "@/lib/site"

import { TemplateMockup } from "./template-mockup"

/**
 * Miniatura del template: la de la API, o la captura real que viene con la app.
 * Si la imagen no carga, cae a la mini-maqueta pintada con el tema por defecto
 * (la tarjeta nunca queda con un hueco roto).
 */
function Thumbnail({ template }: { template: SiteTemplateInfo }) {
  const [failed, setFailed] = React.useState(false)
  const src =
    template.previewImageUrl ?? TEMPLATE_THUMBNAILS[template.key.toUpperCase()]
  if (!src || failed) return <TemplateMockup theme={template.defaultTheme} />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Vista de ejemplo del template ${template.name}`}
      width={640}
      height={400}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-[16/10] w-full rounded-md border object-cover object-top"
    />
  )
}

/** Elegir template: una tarjeta por template, con su miniatura real. */
export function TemplatePicker({
  templates,
  value,
  disabled,
  onSelect,
}: {
  templates: SiteTemplateInfo[]
  value: SiteTemplateKey
  disabled?: boolean
  onSelect: (key: SiteTemplateKey) => void
}) {
  return (
    <section
      aria-labelledby="site-template-title"
      className="flex flex-col gap-3"
    >
      <h2
        id="site-template-title"
        className="font-display text-lg font-semibold"
      >
        Template
      </h2>
      <div
        role="radiogroup"
        aria-labelledby="site-template-title"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {templates.map((template) => {
          const selected = template.key === value
          return (
            <button
              key={template.key}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => !selected && onSelect(template.key)}
              className={cn(
                "flex flex-col gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60",
                selected && "border-primary ring-1 ring-primary"
              )}
            >
              <Thumbnail template={template} />
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 font-medium">
                  {template.name}
                  {selected && (
                    <Badge variant="default">
                      <Check aria-hidden />
                      Elegido
                    </Badge>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  {template.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
