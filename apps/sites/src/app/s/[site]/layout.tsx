import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { WhatsAppFloat } from "@/components/whatsapp-float"
import { loadSite } from "@/lib/load-site"
import { themeStyle } from "@/lib/theme"
import { whatsappLink } from "@/lib/whatsapp"
import { templateKit } from "@/templates"

// Lo publicado se vuelve a pedir a la API cada minuto (ISR).
export const revalidate = 60

// Ningún sitio se genera en el build: se arman al primer pedido y se cachean
// (ISR). Sin esta función, Next los renderizaría en cada visita.
export function generateStaticParams() {
  return []
}

type Params = { params: Promise<{ site: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const loaded = await loadSite((await params).site)
  if (!loaded) return { title: "Sitio no disponible", robots: { index: false } }
  const { site, route } = loaded
  const { brand, seo } = site.content
  return {
    title: {
      default: seo.title || brand.displayName,
      template: `%s | ${brand.displayName}`,
    },
    description: seo.description || undefined,
    icons: brand.faviconUrl ? { icon: brand.faviconUrl } : undefined,
    openGraph: {
      type: "website",
      siteName: brand.displayName,
      locale: "es_AR",
      title: seo.title || brand.displayName,
      description: seo.description || undefined,
      images: seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
    // El borrador nunca se indexa.
    robots: route.previewToken ? { index: false, follow: false } : undefined,
  }
}

export default async function SiteLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode } & Params>) {
  const loaded = await loadSite((await params).site)
  if (!loaded) notFound()
  const { site, route } = loaded
  const kit = templateKit(site.template)
  const wa = whatsappLink(
    site.content.contact.whatsapp,
    site.content.contact.whatsappMessage
  )

  return (
    <div
      style={themeStyle(site.theme)}
      className="bg-site-bg font-site text-site-text flex min-h-dvh flex-col"
    >
      <noscript>
        {/* Sin JS las secciones no pueden "aparecer": se muestran de entrada. */}
        <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      {route.previewToken && (
        <p
          role="status"
          className="bg-site-text text-site-bg px-4 py-2 text-center text-sm font-medium"
        >
          Vista previa del borrador: así se verá cuando lo publiques. Los
          cambios sin guardar no aparecen.
        </p>
      )}
      <kit.Header site={site} route={route} />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <kit.Footer site={site} route={route} />
      <WhatsAppFloat href={wa} />
    </div>
  )
}
