import type { PublicPropertySummary } from "@adminprop/shared-types"

import { CoverImage, Facts, placeOf } from "@/components/property-bits"
import {
  CONSULT_PRICE_LABEL,
  formatPrice,
  hasPrice,
  operationLabel,
} from "@/lib/format"
import { hrefFor } from "@/lib/site-route"

import type { SiteProps } from "../types"

/** MODERN: tarjeta con aire, esquinas grandes y el precio debajo de la foto. */
export function ModernPropertyCard({
  route,
  property,
  priority,
}: SiteProps & { property: PublicPropertySummary; priority?: boolean }) {
  return (
    <article className="group h-full">
      <a
        href={hrefFor(route, `/propiedades/${property.id}`)}
        className="flex h-full flex-col"
      >
        <div className="rounded-site relative aspect-[4/3] overflow-hidden">
          <CoverImage
            property={property}
            priority={priority}
            className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <span className="bg-site-bg absolute top-3 left-3 rounded-full px-3 py-1 text-sm font-semibold">
            {operationLabel(property.operation)}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1 pt-4">
          {hasPrice(property.price) ? (
            <p className="text-2xl font-semibold tracking-tight">
              {formatPrice(property.price, property.currency)}
            </p>
          ) : (
            <p className="text-site-muted text-base">{CONSULT_PRICE_LABEL}</p>
          )}
          <h3 className="text-lg leading-snug font-medium">{property.title}</h3>
          <p className="text-site-muted">{placeOf(property)}</p>
          <Facts property={property} className="text-site-muted mt-2" />
        </div>
      </a>
    </article>
  )
}
