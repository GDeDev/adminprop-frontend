import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MessageCircle } from "lucide-react"

import { ContactForm } from "@/components/contact-form"
import { Gallery } from "@/components/gallery"
import { JsonLd } from "@/components/json-ld"
import { getProperties, getProperty } from "@/lib/api"
import {
  CONSULT_PRICE_LABEL,
  formatPrice,
  hasPrice,
  operationLabel,
} from "@/lib/format"
import { loadSite } from "@/lib/load-site"
import { pageSeo } from "@/lib/seo"
import { basePath, hrefFor } from "@/lib/site-route"
import { whatsappLink } from "@/lib/whatsapp"
import { templateKit } from "@/templates"

export const revalidate = 60

// Se genera al primer pedido y se cachea (ISR), como la home.
export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ site: string; id: string }> }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site: segment, id } = await params
  const loaded = await loadSite(segment)
  if (!loaded || !UUID.test(id)) return {}
  const property = await getProperty(loaded.route, id)
  if (!property) return { title: "Propiedad no disponible" }
  const description = (
    property.publicDescription ??
    `${property.propertyType} en ${property.location}. ${formatPrice(property.price, property.currency)}.`
  ).slice(0, 200)
  return {
    title: property.title,
    description,
    ...pageSeo(loaded.site, loaded.route, `/propiedades/${id}`, {
      title: property.title,
      description,
      image: property.coverPhotoUrl,
    }),
  }
}

export default async function PropertyPage({ params }: Props) {
  const { site: segment, id } = await params
  const loaded = await loadSite(segment)
  if (!loaded || !UUID.test(id)) notFound()
  const { site, route } = loaded
  const kit = templateKit(site.template)

  // La ficha y las "parecidas" se piden a la vez: las parecidas no dependen de
  // la ficha para pedirse (se filtran por operación después) y, si fallan, la
  // ficha sale igual.
  const [property, latest] = await Promise.all([
    getProperty(route, id),
    getProperties(route, { limit: 8 }).catch(() => null),
  ])
  if (!property) notFound()

  // Parecidas: misma operación, sin esta.
  const similar = latest?.data
    .filter((p) => p.id !== property.id && p.operation === property.operation)
    .slice(0, 3)

  const { contact } = site.content
  const wa = whatsappLink(
    contact.whatsapp,
    `Hola, me interesa la propiedad ${property.title} (${property.location}). ¿Me pasan más información?`
  )
  const price = formatPrice(property.price, property.currency)

  return (
    <>
      <Gallery photos={property.photos} title={property.title} />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1.6fr_1fr]">
        <article>
          <p className="text-site-muted text-sm font-semibold tracking-widest uppercase">
            {operationLabel(property.operation)} · {property.propertyType}
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
            {property.title}
          </h1>
          <p className="text-site-muted mt-1">
            {property.address}
            {property.location ? ` · ${property.location}` : ""}
          </p>
          {hasPrice(property.price) ? (
            <p className="mt-4 text-3xl font-semibold">{price}</p>
          ) : (
            // Sin precio no hay nada que destacar: una línea chica, no un título.
            <p className="text-site-muted mt-4 text-lg">
              {CONSULT_PRICE_LABEL}
            </p>
          )}

          {property.features.length > 0 && (
            <section aria-labelledby="datos" className="mt-8">
              <h2 id="datos" className="text-xl font-semibold">
                Datos de la propiedad
              </h2>
              <dl className="rounded-site border-site-border bg-site-border mt-4 grid gap-px overflow-hidden border sm:grid-cols-2">
                {property.features.map((feature) => (
                  <div
                    key={feature.label}
                    className="bg-site-bg flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <dt className="text-site-muted">{feature.label}</dt>
                    <dd className="text-right font-medium">{feature.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {property.publicDescription && (
            <section aria-labelledby="descripcion" className="mt-8">
              <h2 id="descripcion" className="text-xl font-semibold">
                Descripción
              </h2>
              <p className="text-site-text/90 mt-3 whitespace-pre-line">
                {property.publicDescription}
              </p>
            </section>
          )}

          {property.amenities.length > 0 && (
            <section aria-labelledby="comodidades" className="mt-8">
              <h2 id="comodidades" className="text-xl font-semibold">
                Comodidades
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="border-site-border bg-site-surface rounded-full border px-4 py-2 text-sm"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <aside
          aria-labelledby="consulta"
          className="rounded-site border-site-border bg-site-surface h-fit border p-6 lg:sticky lg:top-24"
        >
          <h2 id="consulta" className="text-xl font-semibold">
            Consultá por esta propiedad
          </h2>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-site border-site-primary hover:bg-site-primary hover:text-site-on-primary mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 border-2 px-5 font-semibold"
            >
              <MessageCircle aria-hidden className="size-5" />
              Escribinos por WhatsApp
            </a>
          )}
          <ContactForm
            base={basePath(route)}
            propertyId={property.id}
            disabled={route.previewToken !== null}
            className="mt-5"
          />
        </aside>
      </div>

      {similar && similar.length > 0 && (
        <section
          aria-labelledby="parecidas"
          className="mx-auto max-w-6xl px-4 pb-6"
        >
          <h2 id="parecidas" className="mb-6 text-2xl font-semibold">
            Propiedades parecidas
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <li key={p.id}>
                <kit.PropertyCard site={site} route={route} property={p} />
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <a
              href={hrefFor(route, "/propiedades")}
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              Ver todas las propiedades
            </a>
          </p>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: property.title,
          description: property.publicDescription ?? undefined,
          image: property.photos.map((photo) => photo.url),
          address: property.address,
          ...(property.price
            ? {
                offers: {
                  "@type": "Offer",
                  price: property.price,
                  priceCurrency: property.currency ?? undefined,
                },
              }
            : {}),
        }}
      />
    </>
  )
}
