import type { PublicSite } from "@adminprop/shared-types"

import { hrefFor, type SiteRoute } from "./site-route"

/** Links del menú: las páginas siempre; "Nosotros" solo si la sección es visible. */
export function navLinks(
  site: PublicSite,
  route: SiteRoute
): { href: string; label: string }[] {
  const aboutVisible = site.content.sections.some(
    (s) => s.key === "about" && s.visible
  )
  return [
    { href: hrefFor(route, "/"), label: "Inicio" },
    { href: hrefFor(route, "/propiedades"), label: "Propiedades" },
    ...(aboutVisible
      ? [{ href: hrefFor(route, "/nosotros"), label: "Nosotros" }]
      : []),
    { href: hrefFor(route, "/contacto"), label: "Contacto" },
  ]
}

export function isSectionVisible(
  site: PublicSite,
  key: PublicSite["content"]["sections"][number]["key"]
): boolean {
  return site.content.sections.some((s) => s.key === key && s.visible)
}
