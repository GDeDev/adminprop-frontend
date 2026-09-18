import type { Uuid } from "./common"

/** Maestros (PRD 5.8, Fase 5). Globales en el MVP: sin tenantId. */

export type LocationLevel = "country" | "province" | "city" | "neighborhood"

export interface Location {
  id: Uuid
  level: LocationLevel
  name: string
  parentId: Uuid | null
  isActive: boolean
}

export interface PropertyType {
  id: Uuid
  name: string
  isActive: boolean
}

export interface Amenity {
  id: Uuid
  name: string
  /** Identificador de ícono para la UI (nullable). */
  icon: string | null
  isActive: boolean
}

export interface OperationType {
  id: Uuid
  name: string
  isActive: boolean
}

export interface ServiceType {
  id: Uuid
  name: string
  isActive: boolean
}
