import type { ListingQuery } from "./api"

type RawParams = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value

const MONEY = /^\d{1,12}(\.\d{1,2})?$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Lee los filtros de la URL (`/propiedades?operation=SALE&priceTo=100000`).
 * Lo inválido se ignora en silencio: un link viejo o mal escrito muestra el
 * listado sin ese filtro en vez de un error.
 */
export function parseListingQuery(params: RawParams): ListingQuery {
  const query: ListingQuery = {}
  const operation = first(params.operation)
  if (operation === "SALE" || operation === "RENT") query.operation = operation
  const type = first(params.propertyTypeId)
  if (type && UUID.test(type)) query.propertyTypeId = type
  const location = first(params.locationId)
  if (location && UUID.test(location)) query.locationId = location
  const from = first(params.priceFrom)
  if (from && MONEY.test(from)) query.priceFrom = from
  const to = first(params.priceTo)
  if (to && MONEY.test(to)) query.priceTo = to
  // "Desde" mayor que "hasta": se invierten (si no, el listado sale vacío sin explicación).
  if (
    query.priceFrom !== undefined &&
    query.priceTo !== undefined &&
    Number(query.priceFrom) > Number(query.priceTo)
  ) {
    ;[query.priceFrom, query.priceTo] = [query.priceTo, query.priceFrom]
  }
  const currency = first(params.currency)
  if (currency === "ARS" || currency === "USD") query.currency = currency
  const bedrooms = Number(first(params.bedrooms))
  if (Number.isInteger(bedrooms) && bedrooms >= 1 && bedrooms <= 20) {
    query.bedrooms = bedrooms
  }
  const page = Number(first(params.page))
  if (Number.isInteger(page) && page >= 1 && page <= 1000) query.page = page
  return query
}

/** Los filtros como `?a=1&b=2` (sin la página, que se agrega aparte). */
export function listingSearch(
  query: ListingQuery,
  extra: { page?: number } = {}
): string {
  const search = new URLSearchParams()
  const entries: [string, string | number | undefined][] = [
    ["operation", query.operation],
    ["propertyTypeId", query.propertyTypeId],
    ["locationId", query.locationId],
    ["priceFrom", query.priceFrom],
    ["priceTo", query.priceTo],
    ["currency", query.currency],
    ["bedrooms", query.bedrooms],
    ["page", extra.page && extra.page > 1 ? extra.page : undefined],
  ]
  for (const [key, value] of entries) {
    if (value !== undefined) search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ""
}

/**
 * Páginas a mostrar en la paginación: siempre la primera y la última, la actual
 * y una vecina a cada lado; `null` marca un salto ("…").
 */
export function pageWindow(current: number, total: number): (number | null)[] {
  const wanted = new Set(
    [1, total, current - 1, current, current + 1].filter(
      (n) => n >= 1 && n <= total
    )
  )
  const pages = [...wanted].sort((a, b) => a - b)
  const result: (number | null)[] = []
  pages.forEach((page, i) => {
    const previous = pages[i - 1]
    if (previous !== undefined && page - previous > 1) result.push(null)
    result.push(page)
  })
  return result
}
