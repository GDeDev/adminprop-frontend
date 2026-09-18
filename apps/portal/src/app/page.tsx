import Link from "next/link"

import { Badge } from "@adminprop/ui/components/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@adminprop/ui/components/card"

import { PublicHeader } from "@/components/public-header"
import { getPublicProperties } from "@/lib/public-properties"

/**
 * Home pública (SSG): placeholder del listado de propiedades disponibles.
 * Filtros, fotos y diseño final llegan con la Fase 22 / Claude Design.
 */
export default function HomePage() {
  const properties = getPublicProperties()

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Propiedades en alquiler
          </h1>
          <p className="text-muted-foreground">
            {properties.length} propiedades disponibles
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <li key={property.id}>
              <Link
                href={`/propiedades/${property.id}`}
                className="block h-full"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardDescription className="text-accent">
                      {property.propertyType}
                      {property.neighborhood && ` · ${property.neighborhood}`}
                    </CardDescription>
                    <CardTitle className="font-serif text-lg">
                      {property.address}
                    </CardTitle>
                    {property.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {property.amenities.map((amenity) => (
                          <Badge key={amenity} variant="secondary">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
