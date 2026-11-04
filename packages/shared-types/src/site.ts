/**
 * Contrato del sitio web de la inmobiliaria (spec `web-inmobiliaria.md`,
 * sección 5.1). Es equivalente en contenido a la spec: mismos tipos, campos y
 * comentarios; Prettier reformateó el bloque (sin punto y coma, otros espacios)
 * y se agregó este encabezado. Si algo tiene que
 * cambiar, se cambia primero allá y se anota como desvío.
 */
export type SiteTemplateKey = "CLASSIC" | "MODERN"
export type SiteSectionKey =
  | "hero"
  | "steps"
  | "featured"
  | "metrics"
  | "services"
  | "testimonials"
  | "faqs"
  | "about"
  | "contact"

export interface SiteTheme {
  /** #RRGGBB. Los demás tonos se derivan en el template. */
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  /** Pares permitidos por template; ver SiteTemplateInfo.fontOptions. */
  fontKey: string
  /** 0 | 8 | 16 | 24 (px) */
  radius: number
}

export interface SiteContent {
  brand: {
    displayName: string // ≤ 80
    tagline: string | null // ≤ 120
    logoUrl: string | null // si es null se usa el logo del tenant
    faviconUrl: string | null
  }
  contact: {
    address: string | null // ≤ 200
    hours: string | null // ≤ 200  (ej. "Lun a Vie 9 a 18 · Sáb 9 a 13")
    phone: string | null
    whatsapp: string | null // solo dígitos con código de país
    whatsappMessage: string | null // ≤ 300, mensaje inicial
    email: string | null
    socials: {
      network:
        "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "YOUTUBE" | "TIKTOK" | "X"
      url: string
    }[] // ≤ 6
  }
  hero: {
    title: string // ≤ 120
    subtitle: string | null // ≤ 240
    ctaLabel: string | null // ≤ 40  (ej. "Contactanos hoy")
    backgroundImageUrl: string | null
    showSearch: boolean
  }
  steps: { title: string; description: string; icon: string }[] // ≤ 6; icon = clave de la lista cerrada de íconos
  featured: {
    title: string
    subtitle: string | null
    count: number
    mode: "LATEST" | "MANUAL"
    propertyIds: string[]
  } // count 3..12
  metrics: { value: string; label: string }[] // ≤ 4
  services: { title: string; description: string; imageUrl: string | null }[] // ≤ 6
  testimonials: {
    name: string
    text: string
    role: string | null
    photoUrl: string | null
  }[] // ≤ 12
  faqs: { question: string; answer: string }[] // ≤ 20
  about: { title: string; body: string | null; imageUrl: string | null } // body ≤ 3000
  seo: { title: string; description: string; ogImageUrl: string | null }
  /** Qué secciones se muestran y en qué orden (solo las de la lista del template). */
  sections: { key: SiteSectionKey; visible: boolean }[]
}

export interface SiteSettingsDraft {
  template: SiteTemplateKey
  theme: SiteTheme
  content: SiteContent
}

export interface SiteSettings {
  enabled: boolean
  subdomain: string | null
  customDomain: string | null
  draft: SiteSettingsDraft
  /** null = nunca publicado */
  publishedAt: string | null
  /** true si el borrador difiere de lo publicado */
  hasUnpublishedChanges: boolean
  /** URL pública calculada (subdominio, dominio o URL por slug en desarrollo) */
  publicUrl: string | null
}

export interface SiteTemplateInfo {
  key: SiteTemplateKey
  name: string
  description: string
  previewImageUrl: string | null
  defaultTheme: SiteTheme
  supportedSections: SiteSectionKey[]
  fontOptions: { key: string; label: string }[]
}

/** Lo que lee el sitio público (lista blanca). */
export interface PublicSite {
  template: SiteTemplateKey
  theme: SiteTheme
  content: SiteContent
  tenant: { slug: string; name: string; logoUrl: string | null }
  publishedAt: string
}

export interface SiteAsset {
  id: string
  url: string
  width: number | null
  height: number | null
}
