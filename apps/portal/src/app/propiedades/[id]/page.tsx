import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Badge } from "@adminprop/ui/components/badge"
import { ComingSoon } from "@adminprop/ui/components/coming-soon"

import { PublicHeader } from "@/components/public-header"
import { getPublicProperties, getPublicProperty } from "@/lib/public-properties"

// SSG de las propiedades disponibles; el resto de los ids da 404 (Fase 22:
// una propiedad no disponible no se expone aunque exista).
export const dynamicParams = false

export function generateStaticParams() {
  return getPublicProperties().map((property) => ({ id: property.id }))
}

export async function generateMetadata(
  props: PageProps<"/propiedades/[id]">
): Promise<Metadata> {
  const { id } = await props.params
  const property = getPublicProperty(id)
  if (!property) return {}
  return {
    title: `${property.propertyType} en ${property.neighborhood ?? property.address}`,
  }
}

export default async function PropertyPage(
  props: PageProps<"/propiedades/[id]">
) {
  const { id } = await props.params
  const property = getPublicProperty(id)
  if (!property) notFound()

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver al listado
        </Link>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-accent">
            {property.propertyType}
            {property.neighborhood && ` · ${property.neighborhood}`}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {property.address}
          </h1>
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

        <ComingSoon
          title="Ficha pública"
          description="Fotos, descripción, precio y formulario de contacto — Fase 22."
        />
      </main>
    </>
  )
}
