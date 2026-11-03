"use client"

import { Check } from "lucide-react"

import type { SiteTemplateInfo, SiteTemplateKey } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { cn } from "@adminprop/ui/lib/utils"

import { TemplateMockup } from "./template-mockup"

/**
 * Elegir template: dos tarjetas. La miniatura es `previewImageUrl` si el
 * template la trae; si no, una mini-maqueta pintada con su tema por defecto.
 */
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
        className="grid gap-3 sm:grid-cols-2"
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
              {template.previewImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={template.previewImageUrl}
                  alt={`Miniatura del template ${template.name}`}
                  className="aspect-[16/10] w-full rounded-md border object-cover"
                />
              ) : (
                <TemplateMockup theme={template.defaultTheme} />
              )}
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
