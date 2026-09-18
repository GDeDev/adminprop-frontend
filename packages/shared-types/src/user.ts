import type { Timestamps, Uuid } from "./common"

export type InternalRole = "admin" | "employee"
export type PortalRole = "owner" | "renter"
export type UserRole = InternalRole | PortalRole

/** Usuario interno del backoffice (Fase 4, entidad User). */
export interface User extends Timestamps {
  id: Uuid
  tenantId: Uuid
  email: string
  firstName: string
  lastName: string
  role: InternalRole
  isActive: boolean
}

/** Claims del access token (Fase 4, sección 4). */
export interface AccessTokenClaims {
  sub: Uuid
  tenantId: Uuid
  role: UserRole
  userType: "internal" | "owner" | "renter"
}
