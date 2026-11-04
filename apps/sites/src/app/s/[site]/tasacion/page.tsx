import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ValuationForm } from "@/components/valuation-form"
import { loadSite } from "@/lib/load-site"
import { pageSeo } from "@/lib/seo"
import { basePath } from "@/lib/site-route"
import { templateKit } from "@/templates"

type Props = { params: Promise<{ site: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const loaded = await loadSite((await params).site)
  if (!loaded) return {}
  const { site, route } = loaded
  const description = `Pedí la tasación de tu propiedad con ${site.content.brand.displayName}. Completá el formulario y un asesor te contacta para coordinar la visita.`
  return {
    title: "Tasá tu propiedad",
    description,
    ...pageSeo(site, route, "/tasacion", {
      title: "Tasá tu propiedad",
      description,
    }),
  }
}

export default async function ValuationPage({ params }: Props) {
  const loaded = await loadSite((await params).site)
  if (!loaded) notFound()
  const { site, route } = loaded
  const kit = templateKit(site.template)

  return (
    <>
      <kit.PageTitle
        title="Tasá tu propiedad"
        subtitle="Contanos qué querés tasar y un asesor te contacta para coordinar la visita. Sin costo ni compromiso."
      />
      <section
        aria-label="Solicitud de tasación"
        className="mx-auto max-w-3xl px-4 py-10 md:py-14"
      >
        <ValuationForm
          base={basePath(route)}
          disabled={route.previewToken !== null}
          className="rounded-site border-site-border bg-site-surface border p-6 md:p-8"
        />
      </section>
    </>
  )
}
