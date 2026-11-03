import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { loadSite } from "@/lib/load-site"
import { templateKit } from "@/templates"

type Props = { params: Promise<{ site: string }> }

export const metadata: Metadata = { title: "Contacto" }

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
