import type { PublicPropertySummary } from "@adminprop/shared-types"

import { FavoriteButton } from "@/components/favorite-button"
import { CoverImage, Facts, placeOf } from "@/components/property-bits"
import {
  CONSULT_PRICE_LABEL,
  formatPrice,
  hasPrice,
  operationLabel,
} from "@/lib/format"
import { hrefFor } from "@/lib/site-route"

import type { SiteProps } from "../types"

/** LUXURY: foto vertical, filete fino y el precio en serif debajo; sin sombras. */
export function LuxuryPropertyCard({
  route,
  property,
  priority,
}: SiteProps & { property: PublicPropertySummary; priority?: boolean }) {
  return (
    <article className="group relative h-full">
      <a
        href={hrefFor(route, `/propiedades/${property.id}`)}
        className="flex h-full flex-col"
      >
        <div className="rounded-site relative aspect-[4/5] overflow-hidden">
          <CoverImage
            property={property}
            priority={priority}
            className="transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <span className="bg-site-bg/95 absolute bottom-0 left-0 px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase">
            {operationLabel(property.operation)}
          </span>
        </div>
        <div className="border-site-border mt-4 flex flex-1 flex-col gap-1 border-t pt-4">
          <p className="text-site-muted text-xs tracking-[0.2em] uppercase">
            {placeOf(property)}
          </p>
          <h3 className="font-site-display text-xl leading-snug">
            {property.title}
          </h3>
          {hasPrice(property.price) ? (
            <p className="font-site-display mt-1 text-2xl">
              {formatPrice(property.price, property.currency)}
            </p>
          ) : (
            <p className="text-site-muted mt-1">{CONSULT_PRICE_LABEL}</p>
          )}
          <Facts property={property} className="text-site-muted mt-2" />
        </div>
      </a>
      <FavoriteButton
        slug={route.slug}
        propertyId={property.id}
        title={property.title}
        className="absolute top-3 right-3 z-10"
      />
    </article>
  )
}
