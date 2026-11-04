import type { ListingQuery } from "@/lib/api"
import { listingSearch, SORT_OPTIONS } from "@/lib/listing-query"
import { hrefFor, type SiteRoute } from "@/lib/site-route"

/**
 * Orden del listado como links (no un `<select>`): cada orden es una URL que se
 * comparte y funciona sin JavaScript. Cambiar el orden vuelve a la página 1 y
 * conserva los filtros.
 */
export function SortLinks({
  route,
  query,
}: {
  route: SiteRoute
  query: ListingQuery
}) {
  const current = query.sort ?? "recent"
  return (
    <nav aria-label="Ordenar resultados" className="flex flex-wrap gap-2">
      <span className="text-site-muted inline-flex min-h-11 items-center text-sm">
        Ordenar por
      </span>
      {SORT_OPTIONS.map((option) => {
        const active = option.value === current
        const next: ListingQuery = {
          ...query,
          sort: option.value === "recent" ? undefined : option.value,
        }
        return (
          <a
            key={option.value}
            href={hrefFor(route, `/propiedades${listingSearch(next)}`)}
            aria-current={active ? "true" : undefined}
            className={
              active
                ? "rounded-site bg-site-text text-site-bg inline-flex min-h-11 items-center px-4 text-sm font-semibold"
                : "rounded-site border-site-border inline-flex min-h-11 items-center border px-4 text-sm font-medium"
            }
          >
            {option.label}
          </a>
        )
      })}
    </nav>
  )
}
