import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isSectionVisible } from "@/lib/site-links"
import { loadSite } from "@/lib/load-site"
import { excerpt, pageSeo } from "@/lib/seo"
import { templateKit } from "@/templates"

type Props = { params: Promise<{ site: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const loaded = await loadSite((await params).site)
  if (!loaded) return {}
  const { site, route } = loaded
  const { about, brand } = site.content
  const description =
    excerpt(about.body) ??
    `Conocé a ${brand.displayName}, nuestra historia y cómo trabajamos.`
  return {
    title: about.title || "Nosotros",
    description,
    ...pageSeo(site, route, "/nosotros", {
      title: about.title || "Nosotros",
      description,
      image: about.imageUrl,
    }),
  }
}

export default async function AboutPage({ params }: Props) {
  const loaded = await loadSite((await params).site)
  // "Nosotros" existe solo si la sección está visible en el editor.
  if (!loaded || !isSectionVisible(loaded.site, "about")) notFound()
  const { site, route } = loaded
  const kit = templateKit(site.template)
  const About = kit.sections.about

  return (
    <>
      <kit.PageTitle title={site.content.about.title} />
      <About site={site} route={route} featured={[]} filters={null} />
    </>
  )
}
