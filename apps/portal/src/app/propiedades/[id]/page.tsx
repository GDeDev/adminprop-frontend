import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Badge } from "@adminprop/ui/components/badge"

import { ContactForm } from "@/components/contact-form"
import { PublicHeader } from "@/components/public-header"
import { getPublicProperty, publicTenantSlug } from "@/lib/public-api"
import { priceLabel } from "@/lib/public-format"

// Una propiedad que deja de estar disponible se deja de mostrar (404) al
// revalidar; no se prearman fichas en el build.
export const revalidate = 60

export async function generateMetadata(
  props: PageProps<"/propiedades/[id]">
): Promise<Metadata> {
  const { id } = await props.params
  const property = await getPublicProperty(id)
  if (!property) return {}
  return {
    title: `${property.propertyType} en ${property.neighborhood ?? property.address}`,
    description: property.publicDescription?.slice(0, 160),
  }
}

export default async function PropertyPage(
  props: PageProps<"/propiedades/[id]">
) {
  const { id } = await props.params
  const property = await getPublicProperty(id)
  if (!property) notFound()
  const slug = publicTenantSlug()

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver al listado
        </Link>

        {property.photos.length > 0 && (
          <div
            className="flex snap-x gap-2 overflow-x-auto rounded-xl"
            role="group"
            aria-label="Fotos de la propiedad"
          >
            {property.photos.map((photo, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={`Foto ${index + 1} de ${property.address}`}
                className="h-72 min-w-[85%] snap-center rounded-xl object-cover sm:min-w-[60%]"
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm text-accent">
            {property.propertyType} · {property.location}
          </p>
          <h1 className="text-title-lg font-semibold md:text-display-md">
            {property.address}
          </h1>
          <p className="font-display num text-title-lg font-semibold">
            {priceLabel(property.price, property.currency)}
          </p>
          {property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {property.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {property.publicDescription && (
          <p className="whitespace-pre-line text-muted-foreground">
            {property.publicDescription}
          </p>
        )}

        {property.features.length > 0 && (
          <dl className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 text-sm shadow-raised sm:grid-cols-3">
            {property.features.map((feature) => (
              <div key={feature.label}>
                <dt className="text-muted-foreground">{feature.label}</dt>
                <dd className="font-medium">{feature.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {slug && (
          <ContactForm
            slug={slug}
            propertyId={property.id}
            defaultMessage={`Hola, me interesa la propiedad de ${property.address}.`}
          />
        )}
      </main>
    </>
  )
}
