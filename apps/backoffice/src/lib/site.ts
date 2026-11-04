import { isAxiosError } from "axios"

import type {
  ApiError,
  SiteContent,
  SiteSectionKey,
  SiteSettings,
  SiteSettingsDraft,
  SiteTheme,
  UpdateSiteSettingsRequest,
} from "@adminprop/shared-types"

/* ------------------------------------------------------------------ */
/* Límites del contenido (spec 4.2 / 5.1; los mismos del backend)       */
/* ------------------------------------------------------------------ */

export const SITE_LIMITS = {
  displayName: 80,
  tagline: 120,
  address: 200,
  hours: 200,
  whatsappMessage: 300,
  email: 200,
  heroTitle: 120,
  heroSubtitle: 240,
  ctaLabel: 40,
  stepTitle: 80,
  stepDescription: 300,
  sectionTitle: 120,
  sectionSubtitle: 240,
  metricValue: 24,
  metricLabel: 80,
  serviceTitle: 80,
  serviceDescription: 500,
  testimonialName: 80,
  testimonialText: 600,
  testimonialRole: 80,
  faqQuestion: 200,
  faqAnswer: 1500,
  aboutTitle: 120,
  aboutBody: 3000,
  seoTitle: 70,
  seoDescription: 200,
  url: 1000,
  maxSocials: 6,
  maxSteps: 6,
  maxMetrics: 4,
  maxServices: 6,
  maxTestimonials: 12,
  maxFaqs: 20,
  maxFeatured: 12,
  minFeatured: 3,
} as const

/** Lista cerrada de íconos de los pasos. */
export const STEP_ICONS = [
  { key: "search", label: "Lupa" },
  { key: "home", label: "Casa" },
  { key: "key", label: "Llave" },
  { key: "handshake", label: "Apretón de manos" },
  { key: "file-text", label: "Documento" },
  { key: "calendar", label: "Calendario" },
  { key: "phone", label: "Teléfono" },
  { key: "map-pin", label: "Ubicación" },
  { key: "shield", label: "Escudo" },
  { key: "star", label: "Estrella" },
  { key: "camera", label: "Cámara" },
  { key: "smile", label: "Sonrisa" },
] as const

export const THEME_RADII = [0, 8, 16, 24] as const

export const SOCIAL_NETWORKS = [
  { key: "FACEBOOK", label: "Facebook" },
  { key: "INSTAGRAM", label: "Instagram" },
  { key: "LINKEDIN", label: "LinkedIn" },
  { key: "YOUTUBE", label: "YouTube" },
  { key: "TIKTOK", label: "TikTok" },
  { key: "X", label: "X" },
] as const

export const SECTION_LABELS: Record<SiteSectionKey, string> = {
  hero: "Portada",
  steps: "Cómo trabajamos",
  featured: "Propiedades destacadas",
  metrics: "Números",
  services: "Servicios",
  testimonials: "Testimonios",
  faqs: "Preguntas frecuentes",
  about: "Nosotros",
  contact: "Contacto",
}

/**
 * Miniaturas reales de los templates (capturas del sitio renderizado con datos
 * de ejemplo, 640x400, en `public/templates/`). Se usan cuando el template no
 * trae su propia `previewImageUrl`. Para regenerarlas ver
 * `docs/tecnica/web-inmobiliaria-v1-1.md`.
 */
export const TEMPLATE_THUMBNAILS: Record<string, string> = {
  CLASSIC: "/templates/classic.png",
  MODERN: "/templates/modern.png",
  LUXURY: "/templates/luxury.png",
}

export const TEMPLATE_LABELS = {
  CLASSIC: "Clásico",
  MODERN: "Moderno",
  LUXURY: "Lujo",
} as const

/* ------------------------------------------------------------------ */
/* Estado                                                               */
/* ------------------------------------------------------------------ */

export type SiteStatus = "PUBLISHED" | "DRAFT_CHANGES" | "UNPUBLISHED"

/**
 * Publicado: en línea y el borrador es igual a lo publicado. Borrador con
 * cambios: en línea, pero hay algo sin publicar. Sin publicar: nunca se
 * publicó o se despublicó (el público ve un 404).
 */
export function siteStatus(
  settings: Pick<
    SiteSettings,
    "enabled" | "publishedAt" | "hasUnpublishedChanges"
  >
): SiteStatus {
  if (!settings.enabled || settings.publishedAt === null) return "UNPUBLISHED"
  return settings.hasUnpublishedChanges ? "DRAFT_CHANGES" : "PUBLISHED"
}

export const SITE_STATUS_META: Record<
  SiteStatus,
  { label: string; badge: "disponible" | "mantenimiento" | "borrador" }
> = {
  PUBLISHED: { label: "Publicado", badge: "disponible" },
  DRAFT_CHANGES: { label: "Borrador con cambios", badge: "mantenimiento" },
  UNPUBLISHED: { label: "Sin publicar", badge: "borrador" },
}

/* ------------------------------------------------------------------ */
/* Contraste AA                                                         */
/* ------------------------------------------------------------------ */

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value)
}

function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** Luminancia relativa WCAG de un `#RRGGBB`. */
export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Relación de contraste WCAG 2.x entre dos colores `#RRGGBB` (de 1 a 21).
 * `null` si alguno no es un hex válido.
 */
export function contrastRatio(a: string, b: string): number | null {
  if (!isHexColor(a) || !isHexColor(b)) return null
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [light, dark] = la >= lb ? [la, lb] : [lb, la]
  return (light + 0.05) / (dark + 0.05)
}

export interface ContrastCheck {
  id: "text-background" | "text-surface" | "primary-background"
  label: string
  ratio: number | null
  minimum: number
  /** `false` si el hex es inválido o no llega al mínimo. */
  passes: boolean
}

/**
 * Las tres reglas con las que el backend rechaza publicar: texto/fondo y
 * texto/tarjeta ≥ 4,5 y color principal/fondo ≥ 3.
 */
export function themeContrastChecks(
  theme: Pick<SiteTheme, "primary" | "background" | "surface" | "text">
): ContrastCheck[] {
  const build = (
    id: ContrastCheck["id"],
    label: string,
    a: string,
    b: string,
    minimum: number
  ): ContrastCheck => {
    const ratio = contrastRatio(a, b)
    return {
      id,
      label,
      ratio,
      minimum,
      passes: ratio !== null && ratio >= minimum,
    }
  }
  return [
    build(
      "text-background",
      "Texto sobre fondo",
      theme.text,
      theme.background,
      4.5
    ),
    build(
      "text-surface",
      "Texto sobre tarjetas",
      theme.text,
      theme.surface,
      4.5
    ),
    build(
      "primary-background",
      "Color principal sobre fondo",
      theme.primary,
      theme.background,
      3
    ),
  ]
}

/** "4,52 : 1" */
export function formatRatio(ratio: number | null): string {
  if (ratio === null) return "—"
  return `${ratio.toFixed(2).replace(".", ",")} : 1`
}

/* ------------------------------------------------------------------ */
/* Listas                                                               */
/* ------------------------------------------------------------------ */

/** Mueve el elemento `from` a la posición `to`. Fuera de rango, devuelve la misma lista. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  ) {
    return [...list]
  }
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item as T)
  return next
}

export function removeItem<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index)
}

export function replaceItem<T>(
  list: readonly T[],
  index: number,
  item: T
): T[] {
  return list.map((current, i) => (i === index ? item : current))
}

/* ------------------------------------------------------------------ */
/* Borrador → PUT parcial                                               */
/* ------------------------------------------------------------------ */

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key]
    )
  )
}

/** `true` si el estado local difiere del borrador guardado. */
export function isDraftDirty(
  saved: SiteSettingsDraft,
  local: SiteSettingsDraft
): boolean {
  return !deepEqual(saved, local)
}

/**
 * Arma el body de `PUT /site/settings` con **solo lo que cambió**:
 * `template` si cambió, los campos del tema que cambiaron (la API los mezcla
 * campo a campo) y cada bloque de `content` tocado (la API reemplaza el
 * bloque entero, así que se manda completo). `null` si no hay cambios.
 */
export function buildDraftPatch(
  saved: SiteSettingsDraft,
  local: SiteSettingsDraft
): UpdateSiteSettingsRequest | null {
  const patch: UpdateSiteSettingsRequest = {}

  if (saved.template !== local.template) patch.template = local.template

  const theme: Partial<SiteTheme> = {}
  for (const key of Object.keys(local.theme) as (keyof SiteTheme)[]) {
    if (!deepEqual(saved.theme[key], local.theme[key])) {
      ;(theme as Record<string, unknown>)[key] = local.theme[key]
    }
  }
  if (Object.keys(theme).length > 0) patch.theme = theme

  const content: Partial<SiteContent> = {}
  for (const key of Object.keys(local.content) as (keyof SiteContent)[]) {
    if (!deepEqual(saved.content[key], local.content[key])) {
      ;(content as Record<string, unknown>)[key] = local.content[key]
    }
  }
  if (Object.keys(content).length > 0) patch.content = content

  return Object.keys(patch).length > 0 ? patch : null
}

/* ------------------------------------------------------------------ */
/* Errores 422 por campo                                                */
/* ------------------------------------------------------------------ */

export interface SiteFieldError {
  field: string
  message: string
}

/** Todos los errores por campo de la respuesta de la API (no solo el primero de cada campo). */
export function siteErrorList(error: unknown): SiteFieldError[] {
  if (!isAxiosError<ApiError>(error)) return []
  const details = error.response?.data?.errors ?? []
  return details
    .filter((d) => typeof d.field === "string" && d.field !== "")
    .map((d) => ({ field: d.field as string, message: d.message }))
}

const LEAF_PATTERNS: RegExp[] = [
  /^template$/,
  /^theme\.(primary|secondary|background|surface|text|fontKey|radius)$/,
  /^content\.brand\.(displayName|tagline|logoUrl|faviconUrl)$/,
  /^content\.contact\.(address|hours|phone|whatsapp|whatsappMessage|email)$/,
  /^content\.contact\.socials\[\d+\]\.(network|url)$/,
  /^content\.hero\.(title|subtitle|ctaLabel|backgroundImageUrl|showSearch)$/,
  /^content\.steps\[\d+\]\.(title|description|icon)$/,
  /^content\.featured\.(title|subtitle|count|mode|propertyIds)$/,
  /^content\.metrics\[\d+\]\.(value|label)$/,
  /^content\.services\[\d+\]\.(title|description|imageUrl)$/,
  /^content\.testimonials\[\d+\]\.(name|text|role|photoUrl)$/,
  /^content\.faqs\[\d+\]\.(question|answer)$/,
  /^content\.about\.(title|body|imageUrl)$/,
  /^content\.seo\.(title|description|ogImageUrl)$/,
]

/** Bloques de `content` (y `theme`) que el editor muestra con un mensaje propio. */
export const CONTENT_BLOCKS = [
  "brand",
  "contact",
  "hero",
  "steps",
  "featured",
  "metrics",
  "services",
  "testimonials",
  "faqs",
  "about",
  "seo",
  "sections",
] as const
export type ContentBlock = (typeof CONTENT_BLOCKS)[number]

const BLOCK_PATHS = new Set<string>([
  "theme",
  ...CONTENT_BLOCKS.map((b) => `content.${b}`),
])

/**
 * Lleva el `field` de la API a un lugar del editor: el propio campo si
 * existe, o el bloque que lo contiene (ej. `content.faqs` por pasarse de 20
 * o `content.faqs[3]`). `null` si no se puede ubicar.
 */
export function resolveFieldPath(field: string): string | null {
  let current = field
  while (current !== "") {
    if (LEAF_PATTERNS.some((p) => p.test(current))) return current
    if (BLOCK_PATHS.has(current)) return current
    const stripped = current.replace(/(\[\d+\]|\.[^.[\]]+)$/, "")
    if (stripped === current) return null
    current = stripped
  }
  return null
}

/** Bloque de `content` al que pertenece un path ya resuelto (`null` si es del tema/template). */
export function blockOfPath(path: string): ContentBlock | null {
  const match = /^content\.([a-zA-Z]+)/.exec(path)
  const block = match?.[1]
  return block && (CONTENT_BLOCKS as readonly string[]).includes(block)
    ? (block as ContentBlock)
    : null
}

export interface MappedFieldErrors {
  /** Mensaje por path del editor (el primero si hay varios en el mismo lugar). */
  byPath: Record<string, string>
  /** Los que no se pueden ubicar en un campo: van al resumen de arriba. */
  unmapped: SiteFieldError[]
}

export function mapFieldErrors(errors: SiteFieldError[]): MappedFieldErrors {
  const byPath: Record<string, string> = {}
  const unmapped: SiteFieldError[] = []
  for (const error of errors) {
    const path = resolveFieldPath(error.field)
    if (path === null) unmapped.push(error)
    else if (!(path in byPath)) byPath[path] = error.message
  }
  return { byPath, unmapped }
}

/** Bloques de contenido que tienen al menos un error (para abrirlos). */
export function blocksWithErrors(
  byPath: Record<string, string>
): ContentBlock[] {
  const blocks = new Set<ContentBlock>()
  for (const path of Object.keys(byPath)) {
    const block = blockOfPath(path)
    if (block) blocks.add(block)
  }
  return [...blocks]
}

/* ------------------------------------------------------------------ */
/* URLs                                                                 */
/* ------------------------------------------------------------------ */

export const DEFAULT_SITES_URL = "http://localhost:3003"

export function sitesBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITES_URL ?? DEFAULT_SITES_URL).replace(
    /\/+$/,
    ""
  )
}

/** URL del iframe de la vista previa: el sitio en modo borrador. */
export function previewUrl(slug: string, token: string, base = sitesBaseUrl()) {
  return `${base}/_s/${encodeURIComponent(slug)}?preview=${encodeURIComponent(token)}`
}

/** Milisegundos hasta renovar el token: 60 s antes de que venza (mínimo 10 s). */
export function previewRefreshDelay(expiresAt: string, now = Date.now()) {
  const expires = new Date(expiresAt).getTime()
  if (Number.isNaN(expires)) return 60_000
  return Math.max(10_000, expires - now - 60_000)
}

/** Subdominio válido para escribir: minúsculas, números y guiones (1 a 63). */
export function isValidSubdomainFormat(value: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(value)
}

/** Normaliza lo que se tipea: minúsculas y sin espacios. */
export function normalizeSubdomainInput(value: string): string {
  return value.trim().toLowerCase()
}

/** Dominio sin protocolo, ruta ni espacios, en minúsculas. */
export function normalizeDomainInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
}
