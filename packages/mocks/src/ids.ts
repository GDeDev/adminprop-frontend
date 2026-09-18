/**
 * IDs fijos (UUID v4 válidos) para que las relaciones entre fixtures sean
 * estables y legibles. El último bloque codifica entidad + número.
 */
const id = (block: string) => `00000000-0000-4000-8000-${block}`

export const TENANT_ID = id("000000000001")

export const LOCATION_IDS = {
  argentina: id("000000001001"),
  buenosAiresProvince: id("000000001002"),
  caba: id("000000001003"),
  cabaCity: id("000000001004"),
  laPlata: id("000000001005"),
  quilmes: id("000000001006"),
  palermo: id("000000001101"),
  belgrano: id("000000001102"),
  caballito: id("000000001103"),
  laPlataCentro: id("000000001104"),
  cityBell: id("000000001105"),
  tolosa: id("000000001106"),
  bernal: id("000000001107"),
} as const

export const PROPERTY_TYPE_IDS = {
  house: id("000000002001"),
  apartment: id("000000002002"),
  ph: id("000000002003"),
  retail: id("000000002004"),
  office: id("000000002005"),
  land: id("000000002006"),
} as const

export const AMENITY_IDS = {
  pool: id("000000003001"),
  garage: id("000000003002"),
  grill: id("000000003003"),
  balcony: id("000000003004"),
  terrace: id("000000003005"),
  elevator: id("000000003006"),
} as const

export const SERVICE_TYPE_IDS = {
  rent: id("000000004001"),
  hoaFees: id("000000004002"),
  electricity: id("000000004003"),
  gas: id("000000004004"),
  water: id("000000004005"),
  municipalTax: id("000000004006"),
  insurance: id("000000004007"),
} as const

export const OWNER_IDS = [1, 2, 3, 4, 5, 6].map((n) =>
  id(`00000000510${n}`)
) as [string, string, string, string, string, string]

export const RENTER_IDS = [1, 2, 3, 4, 5, 6, 7].map((n) =>
  id(`00000000610${n}`)
) as [string, string, string, string, string, string, string]

export const GUARANTOR_IDS = [1, 2, 3, 4].map((n) => id(`00000000710${n}`)) as [
  string,
  string,
  string,
  string,
]

export const PROPERTY_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) =>
  id(`00000000810${n}`)
) as [string, string, string, string, string, string, string, string, string]

export const CONTRACT_IDS = [1, 2, 3, 4, 5, 6].map((n) =>
  id(`00000000910${n}`)
) as [string, string, string, string, string, string]
