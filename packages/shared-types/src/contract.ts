import type {
  Currency,
  IsoDate,
  Money,
  Percentage,
  Timestamps,
  Uuid,
} from "./common"

export type ContractStatus = "active" | "finished" | "terminated"

export type RentAdjustmentIndex = "ICL" | "IPC" | "fixed" | "other"

export type RentAdjustmentFrequency =
  "monthly" | "quarterly" | "every_four_months"

export type ServicePayer = "renter" | "owner"

export interface ContractService {
  serviceTypeId: Uuid
  paidBy: ServicePayer
}

/** Contrato de alquiler (PRD 5.5, Fase 9). */
export interface Contract extends Timestamps {
  id: Uuid
  tenantId: Uuid
  propertyId: Uuid
  ownerId: Uuid
  renterId: Uuid
  guarantorId: Uuid | null
  startDate: IsoDate
  endDate: IsoDate
  initialRent: Money
  currency: Currency
  adjustmentIndex: RentAdjustmentIndex
  adjustmentFrequency: RentAdjustmentFrequency
  /** Fijo al monto inicial mientras no se resuelva la consulta a Micaela. */
  securityDeposit: Money
  /** Fijado al crear el contrato (5% o 3% según RN-07 en ese momento). */
  feePercentage: Percentage
  status: ContractStatus
  contractPdfUrl: string | null
  services: ContractService[]
  notes: string | null
  // Seguro de caución
  hasSuretyBond: boolean
  insurerName: string | null
  insurerAlertEmail: string | null
  policyNumber: string | null
  policyExpiryDate: IsoDate | null
  policyPdfUrl: string | null
}
