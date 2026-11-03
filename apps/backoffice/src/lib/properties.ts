import type { PropertyStatus } from "@adminprop/shared-types"

import { normalizeAmount } from "./contracts"

/** Mismos rangos que la API (`LISTING_LIMITS`). */
export const LISTING_LIMITS = {
  count: { min: 0, max: 99 },
  area: { min: 0, max: 99_999_999 },
  ageYears: { min: 0, max: 500 },
} as const

export const MAX_PUBLIC_DESCRIPTION = 2000

export const OPERATION_LABELS = { RENT: "Alquiler", SALE: "Venta" } as const

/** `ok: true` con `null` = campo vacío (no cargado). */
export type ParsedField<T> = { ok: true; value: T | null } | { ok: false }

/** Entero de 0 a `max` (ambientes, dormitorios, baños, antigüedad). Vacío = null. */
export function parseWholeNumber(
  input: string,
  max: number
): ParsedField<number> {
  const text = input.trim()
  if (text === "") return { ok: true, value: null }
  if (!/^\d{1,4}$/.test(text)) return { ok: false }
  const value = Number(text)
  return value <= max ? { ok: true, value } : { ok: false }
}

/** Superficie en m² con hasta 2 decimales (coma o punto). Vacío = null. */
export function parseArea(input: string): ParsedField<number> {
  const text = input.trim()
  if (text === "") return { ok: true, value: null }
  if (!/^\d{1,8}([.,]\d{1,2})?$/.test(text)) return { ok: false }
  const value = Number(text.replace(",", "."))
  return value <= LISTING_LIMITS.area.max ? { ok: true, value } : { ok: false }
}

/** Precio de publicación como string decimal (`150000.00`). Vacío = null. */
export function parseListingPrice(input: string): ParsedField<string> {
  if (input.trim() === "") return { ok: true, value: null }
  const amount = normalizeAmount(input)
  return amount !== null && /^\d{1,12}(\.\d{1,2})?$/.test(amount)
    ? { ok: true, value: amount }
    : { ok: false }
}

/** Pares etiqueta/valor de las características cargadas (omite las vacías). */
export function listingFacts(property: {
  rooms: number | null
  bedrooms: number | null
  bathrooms: number | null
  totalAreaM2: number | null
  coveredAreaM2: number | null
  ageYears: number | null
}): [string, string][] {
  const m2 = (n: number) => `${n.toLocaleString("es-AR")} m²`
  const facts: [string, string | null][] = [
    ["Ambientes", property.rooms === null ? null : String(property.rooms)],
    [
      "Dormitorios",
      property.bedrooms === null ? null : String(property.bedrooms),
    ],
    ["Baños", property.bathrooms === null ? null : String(property.bathrooms)],
    [
      "Superficie total",
      property.totalAreaM2 === null ? null : m2(property.totalAreaM2),
    ],
    [
      "Superficie cubierta",
      property.coveredAreaM2 === null ? null : m2(property.coveredAreaM2),
    ],
    [
      "Antigüedad",
      property.ageYears === null
        ? null
        : `${property.ageYears} ${property.ageYears === 1 ? "año" : "años"}`,
    ],
  ]
  return facts.filter((f): f is [string, string] => f[1] !== null)
}

/** Texto del input para un valor numérico de la API (null → vacío). */
export function numberToInput(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value)
}

/** Texto y variante de `Badge` de cada estado (tabla estado → token del sistema de diseño). */
export const STATUS_META: Record<
  PropertyStatus,
  { label: string; badge: "disponible" | "alquilada" | "mantenimiento" }
> = {
  AVAILABLE: { label: "Disponible", badge: "disponible" },
  RENTED: { label: "Alquilada", badge: "alquilada" },
  MAINTENANCE: { label: "En mantenimiento", badge: "mantenimiento" },
}

/**
 * A qué estados se puede pasar a mano desde cada uno (misma regla que la API,
 * spec Fase 6, 4). La API tiene la última palabra: con un contrato activo
 * rechaza pasar a disponible.
 */
export const MANUAL_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  AVAILABLE: ["RENTED", "MAINTENANCE"],
  RENTED: ["AVAILABLE", "MAINTENANCE"],
  MAINTENANCE: ["AVAILABLE"],
}

export const MAX_PHOTOS = 20
