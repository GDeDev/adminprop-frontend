import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isSectionVisible } from "@/lib/site-links"
import { loadSite } from "@/lib/load-site"
import { templateKit } from "@/templates"

type Props = { params: Promise<{ site: string }> }

export const metadata: Metadata = { title: "Nosotros" }

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
