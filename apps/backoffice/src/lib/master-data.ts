import type { CatalogKey, LocationLevel } from "@adminprop/shared-types"

/** Textos de cada maestro plano, en singular y plural. */
export const CATALOGS: Record<
  CatalogKey,
  { title: string; singular: string; hasIcon: boolean }
> = {
  "property-types": {
    title: "Tipos de propiedad",
    singular: "tipo de propiedad",
    hasIcon: false,
  },
  amenities: { title: "Amenities", singular: "amenity", hasIcon: true },
  "operation-types": {
    title: "Tipos de operación",
    singular: "tipo de operación",
    hasIcon: false,
  },
  "service-types": {
    title: "Tipos de servicio",
    singular: "tipo de servicio",
    hasIcon: false,
  },
}

export const LEVEL_LABELS: Record<LocationLevel, string> = {
  COUNTRY: "País",
  PROVINCE: "Provincia",
  CITY: "Localidad",
  NEIGHBORHOOD: "Barrio",
}

/** Qué se agrega adentro de cada nivel (el hijo "natural"). */
export const CHILD_LEVEL: Record<LocationLevel, LocationLevel | null> = {
  COUNTRY: "PROVINCE",
  PROVINCE: "CITY",
  CITY: "NEIGHBORHOOD",
  NEIGHBORHOOD: null,
}

/** Título del alta de cada nivel (con su género). */
export const NEW_LOCATION_TITLE: Record<LocationLevel, string> = {
  COUNTRY: "Nuevo país",
  PROVINCE: "Nueva provincia",
  CITY: "Nueva localidad",
  NEIGHBORHOOD: "Nuevo barrio",
}
