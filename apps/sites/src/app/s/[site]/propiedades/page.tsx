import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ListingFilters } from "@/components/listing-filters"
import { SortLinks } from "@/components/sort-links"
import { getFilters, getProperties } from "@/lib/api"
import {
  listingSearch,
  pageWindow,
  parseListingQuery,
  withSortCurrency,
} from "@/lib/listing-query"
import { loadSite } from "@/lib/load-site"
import { isFilteredListing, pageSeo } from "@/lib/seo"
import { hrefFor } from "@/lib/site-route"
import { templateKit } from "@/templates"

// Depende de la query (filtros y página): se renderiza en cada pedido. La API
// cachea el listado un minuto, así que el costo es bajo.
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ site: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const loaded = await loadSite((await params).site)
  if (!loaded) return {}
  const { site, route } = loaded
  const description = `Propiedades en venta y alquiler de ${site.content.brand.displayName}. Filtrá por operación, tipo, zona y precio.`
  const filtered = isFilteredListing(parseListingQuery(await searchParams))
  return {
    title: "Propiedades",
    description,
    // Un listado filtrado o paginado repite al base: no se indexa (se siguen
    // los links hacia las fichas). El canonical siempre apunta al listado base.
    robots: filtered ? { index: false, follow: true } : undefined,
    ...pageSeo(site, route, "/propiedades", {
      title: "Propiedades",
      description,
    }),
  }
}

export default async function PropertiesPage({ params, searchParams }: Props) {
  const loaded = await loadSite((await params).site)
  if (!loaded) notFound()
  const { site, route } = loaded
  const kit = templateKit(site.template)
  const query = parseListingQuery(await searchParams)
  // Ordenar por precio exige una moneda (el backend no mezcla ARS y USD).
  const { query: apiQuery, defaulted: currencyDefaulted } =
    withSortCurrency(query)

  // Un rango de precio sin moneda se compara en la de la inmobiliaria (lo
  // resuelve la API); acá solo se pasan los filtros.
  // Si la API falla, `UpstreamError` sube a `error.tsx`: un listado vacío con
  // 200 se podría cachear en un CDN y se confundiría con «no hay propiedades».
  // `null` es la confirmación de la API de que el sitio no existe.
  const [result, filters] = await Promise.all([
    getProperties(route, apiQuery),
    getFilters(route),
  ])
  if (!result) notFound()

  const action = hrefFor({ ...route, previewToken: null }, "/propiedades")
  const properties = result.data
  const pagination = result.pagination
  const pageLink = (page: number) =>
    hrefFor(route, `/propiedades${listingSearch(query, { page })}`)

  return (
    <>
      <kit.PageTitle
        title="Propiedades"
        subtitle="Filtrá por operación, tipo, zona y precio."
      >
        <ListingFilters
          action={action}
          filters={filters}
          query={query}
          preview={route.previewToken}
        />
      </kit.PageTitle>

      <section
        aria-label="Resultados"
        className="mx-auto max-w-6xl px-4 py-10 md:py-14"
      >
        {properties.length === 0 ? (
          <div className="rounded-site border-site-border bg-site-surface border p-8 text-center">
            <p className="text-lg font-semibold">
              No hay propiedades con esos filtros
            </p>
            <p className="text-site-muted mt-2">
              Probá con otra zona o con un rango de precio más amplio.
            </p>
            <a
              href={action}
              className="rounded-site bg-site-primary text-site-on-primary mt-5 inline-flex min-h-11 items-center px-6 font-semibold"
            >
              Ver todas las propiedades
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-site-muted" aria-live="polite">
                {pagination?.total === 1
                  ? "1 propiedad"
                  : `${pagination?.total ?? properties.length} propiedades`}
              </p>
              <SortLinks route={route} query={query} />
            </div>
            {currencyDefaulted && (
              <p className="text-site-muted mb-6 text-sm">
                Ordenado por precio en pesos. Para ver los precios en dólares,
                elegí «Dólares» en «Moneda del precio» y buscá.
              </p>
            )}
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property, i) => (
                <li key={property.id}>
                  <kit.PropertyCard
                    site={site}
                    route={route}
                    property={property}
                    priority={i < 2}
                  />
                </li>
              ))}
            </ul>
            {pagination && pagination.totalPages > 1 && (
              <nav
                aria-label="Páginas de resultados"
                className="mt-10 flex flex-wrap items-center justify-center gap-2"
              >
                {pagination.hasPreviousPage && (
                  <a
                    href={pageLink(pagination.page - 1)}
                    rel="prev"
                    className="rounded-site border-site-border inline-flex min-h-11 items-center border px-4 font-medium"
                  >
                    ← Anterior
                  </a>
                )}
                {pageWindow(pagination.page, pagination.totalPages).map(
                  (page, i) =>
                    page === null ? (
                      <span
                        key={`gap-${i}`}
                        aria-hidden
                        className="text-site-muted px-1"
                      >
                        …
                      </span>
                    ) : (
                      <a
                        key={page}
                        href={pageLink(page)}
                        aria-label={`Página ${page}`}
                        aria-current={
                          page === pagination.page ? "page" : undefined
                        }
                        className={
                          page === pagination.page
                            ? "rounded-site bg-site-text text-site-bg inline-flex size-11 items-center justify-center font-semibold"
                            : "rounded-site border-site-border inline-flex size-11 items-center justify-center border"
                        }
                      >
                        {page}
                      </a>
                    )
                )}
                {pagination.hasNextPage && (
                  <a
                    href={pageLink(pagination.page + 1)}
                    rel="next"
                    className="rounded-site border-site-border inline-flex min-h-11 items-center border px-4 font-medium"
                  >
                    Siguiente →
                  </a>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </>
  )
}
