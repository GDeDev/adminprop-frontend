import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { FavoritesList } from "@/components/favorites-list"
import { getProperties } from "@/lib/api"
import { parseIdsParam } from "@/lib/favorites"
import { loadSite } from "@/lib/load-site"
import { hrefFor } from "@/lib/site-route"
import { templateKit } from "@/templates"

// Depende de `?ids=` (lista compartida): se renderiza en cada pedido.
export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ site: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const loaded = await loadSite((await params).site)
  if (!loaded) return {}
  // Es una lista personal: no se indexa.
  return {
    title: "Favoritos",
    robots: { index: false, follow: true },
  }
}

export default async function FavoritesPage({ params, searchParams }: Props) {
  const loaded = await loadSite((await params).site)
  if (!loaded) notFound()
  const { site, route } = loaded
  const kit = templateKit(site.template)

  // Con `?ids=` es una lista que alguien compartió: se arma en el servidor y
  // no toca los favoritos de quien la abre. Sin ids, es «Mis favoritos».
  const shared = parseIdsParam((await searchParams).ids)
  const result =
    shared.length > 0
      ? await getProperties(route, { ids: shared, limit: shared.length }).catch(
          () => null
        )
      : null
  const order = new Map(shared.map((id, i) => [id, i]))
  const properties = [...(result?.data ?? [])].sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  )

  return (
    <>
      <kit.PageTitle
        title={
          shared.length > 0 ? "Propiedades seleccionadas" : "Mis favoritos"
        }
        subtitle={
          shared.length > 0
            ? "Una lista que te compartieron."
            : "Las propiedades que guardaste en este navegador."
        }
      />
      <section
        aria-label="Favoritos"
        className="mx-auto max-w-6xl px-4 py-10 md:py-14"
      >
        {shared.length === 0 ? (
          <FavoritesList site={site} route={route} />
        ) : result === null ? (
          <div
            role="alert"
            className="rounded-site border-site-border bg-site-surface border p-8 text-center"
          >
            <p className="text-lg font-semibold">No pudimos cargar la lista</p>
            <p className="text-site-muted mt-2">
              Probá de nuevo en un momento.
            </p>
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-site border-site-border bg-site-surface border p-8 text-center">
            <p className="text-lg font-semibold">
              Estas propiedades ya no están disponibles
            </p>
            <a
              href={hrefFor(route, "/propiedades")}
              className="rounded-site bg-site-primary text-site-on-primary mt-5 inline-flex min-h-11 items-center px-6 font-semibold"
            >
              Ver propiedades
            </a>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <li key={property.id}>
                <kit.PropertyCard
                  site={site}
                  route={route}
                  property={property}
                />
              </li>
            ))}
          </ul>
        )}
        {shared.length > 0 && (
          <p className="mt-8">
            <a
              href={hrefFor(route, "/favoritos")}
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              Ver mis favoritos
            </a>
          </p>
        )}
      </section>
    </>
  )
}
