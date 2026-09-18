import "server-only"

import {
  amenities,
  locations,
  properties,
  propertyTypes,
} from "@adminprop/mocks"
import type { Uuid } from "@adminprop/shared-types"

/**
 * Vista pública de una propiedad: solo `available` y sin datos de
 * propietario, inquilino ni notas internas (Fase 22).
 *
 * Hoy lee de mocks en el servidor; se reemplaza por GET /public/properties.
 */
export interface PublicProperty {
  id: Uuid
  address: string
  propertyType: string
  neighborhood: string | null
  amenities: string[]
  photos: string[]
}

function toPublic(property: (typeof properties)[number]): PublicProperty {
  return {
    id: property.id,
    address: property.address,
    propertyType:
      propertyTypes.find((t) => t.id === property.propertyTypeId)?.name ?? "",
    neighborhood:
      locations.find((l) => l.id === property.locationId)?.name ?? null,
    amenities: property.amenityIds
      .map((id) => amenities.find((a) => a.id === id)?.name)
      .filter((name): name is string => Boolean(name)),
    photos: property.photos,
  }
}

export function getPublicProperties(): PublicProperty[] {
  return properties.filter((p) => p.status === "available").map(toPublic)
}

export function getPublicProperty(id: string): PublicProperty | null {
  const property = properties.find(
    (p) => p.id === id && p.status === "available"
  )
  return property ? toPublic(property) : null
}
