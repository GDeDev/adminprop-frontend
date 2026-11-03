import type { Currency, Money, Uuid } from "./common"

/** Contrato de la Fase 22 (REDISENO_FASE_22.md, sección 3). Escrito a mano hasta regenerar. */
export interface PublicPropertySummary {
  id: Uuid
  title: string
  address: string
  propertyType: string
  neighborhood: string | null
  bedrooms: number | null
  bathrooms: number | null
  areaM2: number | null
  price: Money | null
  currency: Currency | null
  coverPhotoUrl: string | null
  amenities: string[]
  /** Sitio web (spec web-inmobiliaria 4.3): campos aditivos. `areaM2` es la superficie total. */
  operation: "SALE" | "RENT"
  rooms: number | null
  coveredAreaM2: number | null
  ageYears: number | null
}

export interface PublicPropertyDetail extends PublicPropertySummary {
  publicDescription: string | null
  photos: { id: Uuid; url: string }[]
  location: string
  features: { label: string; value: string }[]
}

export interface PublicFilters {
  propertyTypes: { id: Uuid; name: string }[]
  locations: { id: Uuid; name: string }[]
}

export interface PublicContactRequest {
  name: string
  email: string
  phone: string
  message: string
  propertyId: Uuid | null
  /** Honeypot: siempre vacío desde el formulario real. */
  website: string
}

export interface PublicListingQuery {
  locationId?: string
  propertyTypeId?: string
  priceFrom?: string
  priceTo?: string
  currency?: Currency
  /** Sitio web: venta o alquiler, mínimos de dormitorios y baños, y selección por ids. */
  operation?: "SALE" | "RENT"
  bedrooms?: number
  bathrooms?: number
  ids?: string[]
  page?: number
}
