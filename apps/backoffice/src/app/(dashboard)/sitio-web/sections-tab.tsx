"use client"

import { ArrowDown, ArrowUp } from "lucide-react"

import type { SiteContent, SiteSectionKey } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"
import { FieldError } from "@adminprop/ui/components/field"
import { Switch } from "@adminprop/ui/components/switch"

import { SECTION_LABELS, moveItem, replaceItem } from "@/lib/site"

import { useClearError, useFieldError } from "./fields"

/** Orden (subir/bajar) y visibilidad de cada sección de la home. */
export function SectionsTab({
  sections,
  supported,
  onChange,
}: {
  sections: SiteContent["sections"]
  /** Secciones que soporta el template elegido (`undefined` = no se sabe). */
  supported: SiteSectionKey[] | undefined
  onChange: (sections: SiteContent["sections"]) => void
}) {
  const clear = useClearError()
  const error = useFieldError("content.sections")

  function change(next: SiteContent["sections"]) {
    clear("content.sections")
    onChange(next)
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-title-md font-semibold">Secciones</h2>
        <p className="text-sm text-muted-foreground">
          Elegí cuáles se muestran y en qué orden aparecen en el inicio.
        </p>
      </div>
      {error && <FieldError errors={[{ message: error }]} />}
      <ol className="flex flex-col gap-2">
        {sections.map((section, index) => {
          const label = SECTION_LABELS[section.key]
          const unavailable =
            supported !== undefined && !supported.includes(section.key)
          return (
            <li
              key={section.key}
              className="flex items-center justify-between gap-2 rounded-lg border bg-card py-1 pr-1 pl-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{label}</p>
                {unavailable && (
                  <p className="text-xs text-muted-foreground">
                    No está disponible en este template.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <label className="flex min-h-11 items-center gap-2 px-2 text-sm">
                  <Switch
                    checked={section.visible}
                    disabled={unavailable}
                    aria-label={`Mostrar ${label}`}
                    onCheckedChange={(visible) =>
                      change(
                        replaceItem(sections, index, { ...section, visible })
                      )
                    }
                  />
                  <span className="hidden sm:inline">
                    {section.visible ? "Visible" : "Oculta"}
                  </span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Subir ${label}`}
                  disabled={index === 0}
                  onClick={() => change(moveItem(sections, index, index - 1))}
                >
                  <ArrowUp aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Bajar ${label}`}
                  disabled={index === sections.length - 1}
                  onClick={() => change(moveItem(sections, index, index + 1))}
                >
                  <ArrowDown aria-hidden />
                </Button>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
