import type { User } from "./api"
import type { Uuid } from "./common"

/** Roles como los manda la API. */
export type Role = User["role"]
/** Entran al backoffice. */
export type InternalRole = Extract<Role, "ADMIN" | "EMPLOYEE">
/** Entran al portal: es el `type` de `POST /auth/portal-login`. */
export type PortalType = Extract<Role, "OWNER" | "RENTER">

/**
 * Área del portal en la URL (`/propietario`, `/inquilino`) y en la
 * navegación. No es el rol de la API: para eso está `PortalType`.
 */
export type PortalRole = "owner" | "renter"

/** Claims del access token (spec Fase 4, sección 4). */
export interface AccessTokenClaims {
  sub: Uuid
  email: string
  tenantId: Uuid
  role: Role
  userType: "internal" | "owner" | "renter"
  exp: number
}
