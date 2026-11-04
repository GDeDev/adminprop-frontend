import Link from "next/link"

import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@adminprop/ui/components/card"
import {
  AnimatedList,
  AnimatedListItem,
} from "@adminprop/ui/components/animated-list"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { GradientSurface } from "@adminprop/ui/components/gradient-surface"

import { PublicHeader } from "@/components/public-header"
import { ListingFilters } from "@/components/listing-filters"
import { getPublicFilters, getPublicListing } from "@/lib/public-api"
import { listingHref, parseListingQuery, priceLabel } from "@/lib/public-format"

// El listado se vuelve a pedir a la API como mucho una vez por minuto.
export const revalidate = 60

/**
 * Home pública (Fase 22): propiedades disponibles con filtros de ubicación,
 * tipo y precio en la URL. Sin SEO como foco, pero se renderiza en el servidor.
 */
export default async function HomePage(props: PageProps<"/">) {
  const query = parseListingQuery(await props.searchParams)
  const [listing, filters] = await Promise.all([
    getPublicListing(query),
    getPublicFilters(),
  ])

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <GradientSurface className="flex flex-col gap-1 px-6 py-8 md:py-10">
          <h1 className="text-display-md font-semibold md:text-display-lg">
            Propiedades en alquiler
          </h1>
          {listing && (
            <p className="text-muted-foreground">
              {listing.pagination.total}{" "}
              {listing.pagination.total === 1
                ? "propiedad disponible"
                : "propiedades disponibles"}
            </p>
          )}
        </GradientSurface>

        <ListingFilters filters={filters} query={query} />

        {!listing ? (
          <EmptyState
            title="No pudimos cargar las propiedades"
            description="Probá de nuevo en unos minutos."
          />
        ) : listing.data.length === 0 ? (
          <EmptyState
            title="No hay propiedades con esos filtros"
            description="Probá quitando algún filtro."
          />
        ) : (
          <AnimatedList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listing.data.map((property) => (
              <AnimatedListItem key={property.id}>
                <Link
                  href={`/propiedades/${property.id}`}
                  className="block h-full"
                >
                  <Card className="group h-full lift overflow-hidden pt-0">
                    {property.coverPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={property.coverPhotoUrl}
                        alt={`Foto de ${property.address}`}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                        Sin foto
                      </div>
                    )}
                    <CardHeader>
                      <CardDescription className="text-accent">
                        {property.propertyType}
                        {property.neighborhood && ` · ${property.neighborhood}`}
                      </CardDescription>
                      <CardTitle className="font-display text-title-md">
                        {property.address}
                      </CardTitle>
                      <p className="font-display num text-title-md font-semibold">
                        {priceLabel(property.price, property.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {[
                          property.bedrooms !== null &&
                            `${property.bedrooms} dorm.`,
                          property.bathrooms !== null &&
                            `${property.bathrooms} baños`,
                          property.areaM2 !== null && `${property.areaM2} m²`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {property.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {property.amenities.slice(0, 4).map((amenity) => (
                            <Badge key={amenity} variant="secondary">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        )}

        {listing && listing.pagination.hasNextPage && (
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link
                href={listingHref({
                  ...query,
                  page: listing.pagination.page + 1,
                })}
              >
                Ver más
              </Link>
            </Button>
          </div>
        )}
      </main>
    </>
  )
}
