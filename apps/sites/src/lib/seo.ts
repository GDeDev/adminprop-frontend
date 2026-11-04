import type { Metadata } from "next"

import type { PublicSite } from "@adminprop/shared-types"

import { canonicalUrl, type SiteRoute } from "./site-route"

/**
 * `alternates.canonical` y `openGraph` de una página. Next reemplaza el objeto
 * `openGraph` entero cuando una página define el suyo, así que acá va completo
 * (sitio, idioma, imagen), no solo la URL.
 */
export function pageSeo(
  site: PublicSite,
  route: SiteRoute,
  path: string,
  page: {
    title: string
    description?: string | null
    image?: string | null
    type?: "website" | "article"
  }
): Pick<Metadata, "alternates" | "openGraph"> {
  const url = canonicalUrl(route, path)
  const { brand, seo } = site.content
  const image = page.image ?? seo.ogImageUrl
  return {
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      type: page.type ?? "website",
      siteName: brand.displayName,
      locale: "es_AR",
      title: page.title,
      description: page.description || undefined,
      url: url ?? undefined,
      images: image ? [{ url: image }] : undefined,
    },
  }
}

/** Primer tramo de un texto, cortado en una palabra, para `description`. */
export function excerpt(
  text: string | null | undefined,
  max = 160
): string | undefined {
  const clean = text?.replace(/\s+/g, " ").trim()
  if (!clean) return undefined
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : cut.length)}…`
}

/** ¿Es un listado filtrado o paginado? Esos no se indexan (duplican al listado base). */
export function isFilteredListing(query: object): boolean {
  return Object.values(query).some((value) => value !== undefined)
}
