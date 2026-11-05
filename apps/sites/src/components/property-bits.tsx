import { Bath, BedDouble, Building2, Maximize } from "lucide-react"

import type { PublicPropertySummary } from "@adminprop/shared-types"

import { cardFacts } from "@/lib/format"
import { cn } from "@/lib/cn"

import { SiteImage } from "./site-image"

const FACT_ICONS = {
  bedrooms: BedDouble,
  bathrooms: Bath,
  area: Maximize,
} as const

/** Datos cortos con ícono (dormitorios, baños, superficie); vacío si no hay ninguno. */
export function Facts({
  property,
  className,
}: {
  property: PublicPropertySummary
  className?: string
}) {
  const facts = cardFacts(property)
  if (facts.length === 0) return null
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-sm", className)}>
      {facts.map((fact) => {
        const Icon = FACT_ICONS[fact.key]
        return (
          <li key={fact.key} className="flex items-center gap-1.5">
            <Icon aria-hidden className="size-4" />
            {fact.label}
          </li>
        )
      })}
    </ul>
  )
}

/** Foto de portada, o un bloque neutro con ícono cuando la propiedad no tiene. */
export function CoverImage({
  property,
  priority = false,
  className,
}: {
  property: PublicPropertySummary
  priority?: boolean
  className?: string
}) {
  return property.coverPhotoUrl ? (
    <SiteImage
      src={property.coverPhotoUrl}
      alt={`${property.title}, ${property.propertyType}`}
      width={640}
      height={480}
      priority={priority}
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      className={cn("size-full object-cover", className)}
    />
  ) : (
    <div
      role="img"
      aria-label={`${property.title}: sin foto`}
      className={cn(
        "bg-site-surface text-site-muted flex size-full items-center justify-center",
        className
      )}
    >
      <Building2 aria-hidden className="size-12" />
    </div>
  )
}

/** Dirección / barrio en una línea. */
export function placeOf(property: PublicPropertySummary): string {
  return [property.neighborhood, property.propertyType]
    .filter(Boolean)
    .join(" · ")
}
