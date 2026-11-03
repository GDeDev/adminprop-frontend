import type { PublicPropertySummary } from "@adminprop/shared-types"

import { CoverImage, Facts, placeOf } from "@/components/property-bits"
import { formatPrice, operationLabel } from "@/lib/format"
import { hrefFor } from "@/lib/site-route"

import type { SiteProps } from "../types"

/** CLASSIC: foto 4:3 con el precio sobre la imagen. */
export function ClassicPropertyCard({
  route,
  property,
  priority,
}: SiteProps & { property: PublicPropertySummary; priority?: boolean }) {
  return (
    <article className="group rounded-site border-site-border bg-site-surface overflow-hidden border">
      <a
        href={hrefFor(route, `/propiedades/${property.id}`)}
        className="block"
        aria-label={`${property.title}, ${formatPrice(property.price, property.currency)}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <CoverImage
            property={property}
            priority={priority}
            className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <span className="bg-site-primary text-site-on-primary absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            {operationLabel(property.operation)}
          </span>
          <span className="bg-site-bg/90 absolute right-0 bottom-0 px-4 py-2 text-lg font-semibold">
            {formatPrice(property.price, property.currency)}
          </span>
        </div>
        <div className="space-y-2 p-4">
          <h3 className="text-lg leading-snug font-semibold">
            {property.title}
          </h3>
          <p className="text-site-muted text-sm">{placeOf(property)}</p>
          <Facts property={property} className="text-site-muted pt-1" />
        </div>
      </a>
    </article>
  )
}
