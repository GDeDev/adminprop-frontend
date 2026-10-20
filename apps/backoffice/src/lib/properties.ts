import type { PropertyStatus } from "@adminprop/shared-types"

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
