import "server-only"

import { cache } from "react"

import type { PublicSite } from "@adminprop/shared-types"

import { getFilters, getProperties, getSite } from "./api"
import { decodeSiteRoute, type SiteRoute } from "./site-route"
import type { HomeData } from "@/templates/types"

export interface LoadedSite {
  route: SiteRoute
  site: PublicSite
}

/**
 * El sitio de un pedido. `cache` de React evita pedirlo dos veces (layout y
 * página) dentro del mismo render. `null` si el segmento no es válido o el
 * sitio no existe / no está publicado.
 */
export const loadSite = cache(
  async (segment: string): Promise<LoadedSite | null> => {
    const route = decodeSiteRoute(segment)
    if (!route) return null
    const site = await getSite(route)
    return site ? { route, site } : null
  }
)

/**
 * Destacadas (las últimas, o las elegidas a mano en su orden) y filtros del
 * buscador. Si la API falla (`UpstreamError`) NO se atrapa: la home se cachea
 * por ISR y una home sin destacadas ni buscador quedaría publicada hasta la
 * próxima revalidación. Lanzando, Next conserva la última versión buena.
 */
export async function loadHomeData(loaded: LoadedSite): Promise<HomeData> {
  const { route, site } = loaded
  const { featured: config, sections } = site.content
  const showFeatured = sections.some((s) => s.key === "featured" && s.visible)
  const showSearch = sections.some((s) => s.key === "hero" && s.visible)

  const [list, filters] = await Promise.all([
    showFeatured
      ? config.mode === "MANUAL"
        ? config.propertyIds.length > 0
          ? getProperties(route, {
              ids: config.propertyIds,
              limit: config.propertyIds.length,
            })
          : Promise.resolve(null)
        : getProperties(route, { limit: config.count })
      : Promise.resolve(null),
    showSearch ? getFilters(route) : Promise.resolve(null),
  ])

  let featured = list?.data ?? []
  if (config.mode === "MANUAL") {
    // La API devuelve las más nuevas primero; acá va el orden que eligió.
    const order = new Map(config.propertyIds.map((id, i) => [id, i]))
    featured = [...featured].sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    )
  }
  return { featured: featured.slice(0, config.count), filters }
}
