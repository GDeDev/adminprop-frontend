import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ListingFilters } from "@/components/listing-filters"
import { getFilters, getProperties } from "@/lib/api"
import {
  listingSearch,
  pageWindow,
  parseListingQuery,
} from "@/lib/listing-query"
import { loadSite } from "@/lib/load-site"
import { hrefFor } from "@/lib/site-route"
import { templateKit } from "@/templates"

// Depende de la query (filtros y página): se renderiza en cada pedido. La API
// cachea el listado un minuto, así que el costo es bajo.
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ site: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const loaded = await loadSite((await params).site)
  if (!loaded) return {}
  return {
    title: "Propiedades",
    description: `Propiedades en venta y alquiler de ${loaded.site.content.brand.displayName}.`,
  }
}

export default async function PropertiesPage({ params, searchParams }: Props) {
  const loaded = await loadSite((await params).site)
  if (!loaded) notFound()
  const { site, route } = loaded
  const kit = templateKit(site.template)
  const query = parseListingQuery(await searchParams)

  // Un rango de precio sin moneda se compara en la de la inmobiliaria (lo
  // resuelve la API); acá solo se pasan los filtros.
  // Si la API falla, el listado muestra su propio aviso en vez de la página de error.
  const [result, filters] = await Promise.all([
    getProperties(route, query).catch(() => null),
    getFilters(route).catch(() => null),
  ])

  const action = hrefFor({ ...route, previewToken: null }, "/propiedades")
  const properties = result?.data ?? []
  const pagination = result?.pagination
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
        {result === null ? (
          <div
            role="alert"
            className="rounded-site border-site-border bg-site-surface border p-8 text-center"
          >
            <p className="text-lg font-semibold">
              No pudimos cargar las propiedades
            </p>
            <p className="text-site-muted mt-2">
              Probá de nuevo en un momento.
            </p>
          </div>
        ) : properties.length === 0 ? (
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
            <p className="text-site-muted mb-6" aria-live="polite">
              {pagination?.total === 1
                ? "1 propiedad"
                : `${pagination?.total ?? properties.length} propiedades`}
            </p>
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
