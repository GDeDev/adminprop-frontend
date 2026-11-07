import { formatMoney } from "@adminprop/ui/lib/format"
import type {
  Currency,
  Money,
  PublicListingQuery,
} from "@adminprop/shared-types"

/** "$ 450.000" o "Consultar" cuando la propiedad no tiene precio publicado. */
export function priceLabel(
  price: Money | null,
  currency: Currency | null
): string {
  if (price === null || currency === null) return "Consultar"
  if (Number.isNaN(Number(price))) return "Consultar"
  return formatMoney(price, currency, { maximumFractionDigits: 0 })
}

/** Lee los filtros de la URL del listado; ignora lo que no tenga forma válida. */
export function parseListingQuery(
  raw: Record<string, string | string[] | undefined>
): PublicListingQuery {
  const one = (key: string): string | undefined => {
    const value = raw[key]
    const text = Array.isArray(value) ? value[0] : value
    return text && text.trim() !== "" ? text.trim() : undefined
  }
  const amount = (key: string): string | undefined => {
    const text = one(key)
    return text && /^\d+(\.\d{1,2})?$/.test(text) ? text : undefined
  }
  const currency = one("currency")
  const page = Number(one("page"))
  return {
    locationId: one("locationId"),
    propertyTypeId: one("propertyTypeId"),
    priceFrom: amount("priceFrom"),
    priceTo: amount("priceTo"),
    currency: currency === "ARS" || currency === "USD" ? currency : undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  }
}

/** Query string de un listado con filtros (sin valores vacíos). */
export function listingHref(query: PublicListingQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value))
  }
  const text = params.toString()
  return text ? `/?${text}` : "/"
}
