import type { IsoDate, Timestamps, Uuid } from "./common"

/**
 * Inquilino (PRD 5.3, Fase 8). Se usa "Renter" en código para no chocar
 * con "Tenant" (la inmobiliaria en el modelo multi-tenant).
 */
export interface Renter extends Timestamps {
  id: Uuid
  tenantId: Uuid
  firstName: string
  lastName: string
  /** Único por tenant. */
  nationalId: string
  phone: string
  email: string | null
  address: string
  /** Fecha de inicio del primer contrato. */
  startDate: IsoDate
  guarantorId: Uuid | null
  portalUsername: string | null
}

export type GuaranteeType = "property" | "payslips"

/** Garante (PRD 5.4, Fase 8). Puede garantizar varios contratos. */
export interface Guarantor extends Timestamps {
  id: Uuid
  tenantId: Uuid
  firstName: string
  lastName: string
  nationalId: string
  phone: string
  email: string | null
  address: string
  guaranteeType: GuaranteeType
  /** Texto libre: dirección/datos registrales o empleador/monto. */
  guaranteeDetails: string
}
