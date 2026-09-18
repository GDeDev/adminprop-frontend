import type { Timestamps, Uuid } from "./common"

export type PropertyStatus = "available" | "rented" | "under_maintenance"

/** Propiedad (PRD 5.1, Fase 6). */
export interface Property extends Timestamps {
  id: Uuid
  tenantId: Uuid
  address: string
  locationId: Uuid | null
  propertyTypeId: Uuid
  status: PropertyStatus
  /** Nullable mientras Fase 6 corre antes/en paralelo a Fase 7. */
  ownerId: Uuid | null
  /** Inquilino del contrato activo, si hay. */
  renterId: Uuid | null
  amenityIds: Uuid[]
  /** Notas internas — no se exponen en el portal público. */
  notes: string | null
  /** URLs de fotos (Cloudinary). Máximo 20. */
  photos: string[]
}
