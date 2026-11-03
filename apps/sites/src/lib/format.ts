import type { PublicPropertySummary } from "@adminprop/shared-types"

/** "150000.00" + "USD" → "US$ 150.000". Sin precio es "Consultar". */
export function formatPrice(
  price: string | null,
  currency: string | null
): string {
  if (!price) return "Consultar"
  const amount = Number(price)
  if (!Number.isFinite(amount)) return "Consultar"
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
  return `${currency === "USD" ? "US$" : "$"} ${formatted}`
}

export function formatArea(value: number | null): string | null {
  if (value === null) return null
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value)} m²`
}

export function operationLabel(operation: "SALE" | "RENT"): string {
  return operation === "SALE" ? "Venta" : "Alquiler"
}

/** Datos cortos de la tarjeta, solo los que están cargados. */
export function cardFacts(
  property: PublicPropertySummary
): { key: "bedrooms" | "bathrooms" | "area"; label: string }[] {
  const facts: { key: "bedrooms" | "bathrooms" | "area"; label: string }[] = []
  if (property.bedrooms !== null) {
    facts.push({
      key: "bedrooms",
      label: `${property.bedrooms} ${property.bedrooms === 1 ? "dormitorio" : "dormitorios"}`,
    })
  }
  if (property.bathrooms !== null) {
    facts.push({
      key: "bathrooms",
      label: `${property.bathrooms} ${property.bathrooms === 1 ? "baño" : "baños"}`,
    })
  }
  const area = formatArea(property.areaM2)
  if (area) facts.push({ key: "area", label: area })
  return facts
}
