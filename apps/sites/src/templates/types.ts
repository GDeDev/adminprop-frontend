import type { ReactNode } from "react"

import type {
  PublicFilters,
  PublicPropertySummary,
  PublicSite,
  SiteSectionKey,
} from "@adminprop/shared-types"

import type { SiteRoute } from "@/lib/site-route"

export interface SiteProps {
  site: PublicSite
  route: SiteRoute
}

/** Datos que la home resuelve una vez y comparten sus secciones. */
export interface HomeData {
  featured: PublicPropertySummary[]
  filters: PublicFilters | null
}

export type SectionProps = SiteProps & HomeData

/**
 * Lo que un template aporta. Todos muestran las mismas secciones y el mismo
 * contenido editable; cambian el layout, la tipografía y el estilo. El único
 * mapa `template → componentes` vive en `templates/index.ts`.
 */
export interface TemplateKit {
  Header: (props: SiteProps) => ReactNode
  Footer: (props: SiteProps) => ReactNode
  PropertyCard: (
    props: SiteProps & { property: PublicPropertySummary; priority?: boolean }
  ) => ReactNode
  sections: Record<SiteSectionKey, (props: SectionProps) => ReactNode>
  /** Portada de las páginas internas (listado, ficha, contacto, nosotros). */
  PageTitle: (props: {
    title: string
    subtitle?: string | null
    children?: ReactNode
  }) => ReactNode
}
