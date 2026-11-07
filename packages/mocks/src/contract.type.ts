/**
 * Forma de los contratos de prueba. Es local: los tipos reales de la API
 * viven en @adminprop/shared-types y este mock sólo alimenta el chequeo de
 * datos del dashboard hasta que esa pantalla use la API.
 */
export interface MockContractService {
  serviceTypeId: string
  paidBy: "renter" | "owner"
}

export interface MockContract {
  id: string
  tenantId: string
  propertyId: string
  ownerId: string
  renterId: string
  guarantorId: string | null
  startDate: string
  endDate: string
  initialRent: string
  currency: "ARS" | "USD"
  adjustmentIndex: "ICL" | "IPC" | "fixed" | "other"
  adjustmentFrequency: "monthly" | "quarterly" | "every_four_months"
  securityDeposit: string
  feePercentage: string
  status: "active" | "finished" | "terminated"
  contractPdfUrl: string | null
  services: MockContractService[]
  notes: string | null
  hasSuretyBond: boolean
  insurerName: string | null
  insurerAlertEmail: string | null
  policyNumber: string | null
  policyExpiryDate: string | null
  policyPdfUrl: string | null
  createdAt: string
  updatedAt: string
}
