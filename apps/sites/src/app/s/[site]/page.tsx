import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { JsonLd } from "@/components/json-ld"
import { loadHomeData, loadSite } from "@/lib/load-site"
import { pageSeo } from "@/lib/seo"
import { templateKit } from "@/templates"

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ site: string }>
}): Promise<Metadata> {
  const loaded = await loadSite((await params).site)
  if (!loaded) return {}
  const { site, route } = loaded
  const { seo, brand } = site.content
  return pageSeo(site, route, "/", {
    title: seo.title || brand.displayName,
    description: seo.description,
  })
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ site: string }>
}) {
  const loaded = await loadSite((await params).site)
  if (!loaded) notFound()
  const { site, route } = loaded
  const kit = templateKit(site.template)
  const data = await loadHomeData(loaded)
  const { contact, brand } = site.content

  return (
    <>
      {site.content.sections
        .filter((section) => section.visible)
        .map((section) => {
          const Section = kit.sections[section.key]
          // "Nosotros" tiene su propia página; en la home es un resumen.
          return Section ? (
            <Section key={section.key} site={site} route={route} {...data} />
          ) : null
        })}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: brand.displayName,
          description: site.content.seo.description || undefined,
          telephone: contact.phone ?? undefined,
          email: contact.email ?? undefined,
          address: contact.address ?? undefined,
          image: brand.logoUrl ?? site.tenant.logoUrl ?? undefined,
        }}
      />
    </>
  )
}
