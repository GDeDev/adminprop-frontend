import { escapeXml } from "./absolute-url"

export interface SitemapEntry {
  path: string
  /** Fecha de la última modificación real (ISO). Sin dato, no se inventa. */
  lastmod?: string | null
}

/** `lastmod` válido del sitemap: fecha ISO con o sin hora; lo ilegible se omite. */
export function sitemapDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** El XML del sitemap de un sitio. */
export function buildSitemap(base: string, entries: SitemapEntry[]): string {
  const rows = entries.map((entry) => {
    const lastmod = sitemapDate(entry.lastmod)
    return `  <url><loc>${escapeXml(base + entry.path)}</loc>${
      lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
    }</url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`
}
