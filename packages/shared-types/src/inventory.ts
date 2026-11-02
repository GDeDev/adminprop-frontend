import type { IsoDate, IsoDateTime, Uuid } from "./common"

/** Contrato de la Fase 25 (REDISENO_FASE_25.md, sección 3). Escrito a mano hasta regenerar. */
export type InventoryType = "DELIVERY" | "RETURN"
export type InventoryStatus = "DRAFT" | "CONFIRMED"
export type ItemCondition = "GOOD" | "FAIR" | "POOR" | "NOT_APPLICABLE"
export type InventoryChange =
  "WORSE" | "BETTER" | "SAME" | "ONLY_DELIVERY" | "ONLY_RETURN"

export interface InventoryPhoto {
  id: Uuid
  url: string
}

export interface InventoryItem {
  id: Uuid
  category: string
  description: string
  condition: ItemCondition
  notes: string | null
  photos: InventoryPhoto[]
}

export interface InventorySummary {
  id: Uuid
  contractId: Uuid
  type: InventoryType
  date: IsoDate
  status: InventoryStatus
  tenantAcknowledged: boolean
  itemCount: number
  poorCount: number
  photoCount: number
  performedBy: { id: Uuid; fullName: string } | null
  confirmedAt: IsoDateTime | null
  correctsInventoryId: Uuid | null
}

export interface InventoryDetail extends InventorySummary {
  generalNotes: string | null
  correctionReason: string | null
  items: InventoryItem[]
  warnings: string[]
}

export interface ContractInventories {
  inventories: InventorySummary[]
  canCreateDelivery: boolean
  canCreateReturn: boolean
}

export interface CreateInventoryRequest {
  type: InventoryType
  date?: IsoDate
  generalNotes?: string | null
}

export interface UpdateInventoryItemRequest {
  id?: Uuid
  category: string
  description: string
  condition: ItemCondition
  notes: string | null
}

export interface UpdateInventoryRequest {
  date?: IsoDate
  generalNotes?: string | null
  tenantAcknowledged?: boolean
  items?: UpdateInventoryItemRequest[]
}

export interface InventoryComparisonRow {
  category: string
  description: string
  deliveryCondition: ItemCondition | null
  returnCondition: ItemCondition | null
  change: InventoryChange
  deliveryNotes: string | null
  returnNotes: string | null
  deliveryPhotos: InventoryPhoto[]
  returnPhotos: InventoryPhoto[]
}

export interface InventoryComparison {
  hasDelivery: boolean
  hasReturn: boolean
  deliveryDate: IsoDate | null
  returnDate: IsoDate | null
  rows: InventoryComparisonRow[]
  worsenedCount: number
}
