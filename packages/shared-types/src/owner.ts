import type { Timestamps, Uuid } from "./common"

export interface BankDetails {
  /** CBU de 22 dígitos. */
  cbu: string
  alias: string
  bankName: string
  accountHolder: string
}

/** Propietario (PRD 5.2, Fase 7). */
export interface Owner extends Timestamps {
  id: Uuid
  tenantId: Uuid
  firstName: string
  lastName: string
  /** Único por tenant. */
  nationalId: string
  phone: string
  email: string | null
  address: string
  bankDetails: BankDetails | null
  notes: string | null
  /** Usuario de portal (null si todavía no se generaron credenciales). */
  portalUsername: string | null
}

/**
 * Campos derivados que la API expone en GET /owners (calculados, no
 * almacenados — Fase 7, RN-07).
 */
export interface OwnerSummary extends Owner {
  activePropertiesCount: number
  qualifiesForReducedFee: boolean
}
