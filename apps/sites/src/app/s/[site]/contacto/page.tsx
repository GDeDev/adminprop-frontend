import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { loadSite } from "@/lib/load-site"
import { pageSeo } from "@/lib/seo"
import { templateKit } from "@/templates"

type Props = { params: Promise<{ site: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const loaded = await loadSite((await params).site)
  if (!loaded) return {}
  const { site, route } = loaded
  const { brand, contact } = site.content
  const description = [
    `Contactá a ${brand.displayName}.`,
    contact.address ? `Estamos en ${contact.address}.` : null,
    contact.hours ? `Atendemos ${contact.hours}.` : null,
    "Escribinos y te respondemos a la brevedad.",
  ]
    .filter(Boolean)
    .join(" ")
  return {
    title: "Contacto",
    description,
    ...pageSeo(site, route, "/contacto", { title: "Contacto", description }),
  }
}

export default async function ContactPage({ params }: Props) {
  const loaded = await loadSite((await params).site)
  if (!loaded) notFound()
  const { site, route } = loaded
  const kit = templateKit(site.template)
  const Contact = kit.sections.contact

  return (
    <>
      <kit.PageTitle
        title="Contacto"
        subtitle="Escribinos y te respondemos a la brevedad."
      />
      <Contact site={site} route={route} featured={[]} filters={null} />
    </>
  )
}
