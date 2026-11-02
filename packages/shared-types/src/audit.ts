import type { IsoDateTime, Uuid } from "./common"

/** Contrato de la Fase 20 (REDISENO_FASE_19_20.md, sección 8). Escrito a mano hasta regenerar. */
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "RESTORE"
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "NOTIFICATION_SENT"
  | "JOB_RUN"
  | "EXPORT"

export type AuditActorKind =
  "USER" | "SYSTEM" | "PORTAL_OWNER" | "PORTAL_RENTER"

export interface AuditEntry {
  id: Uuid
  entity: string
  entityId: Uuid | null
  action: AuditAction
  summary: string
  actorKind: AuditActorKind
  userId: Uuid | null
  userEmail: string | null
  userName: string | null
  ip: string | null
  createdAt: IsoDateTime
}

export interface AuditChange {
  field: string
  before: unknown
  after: unknown
  /** Nombre legible cuando el valor es un id (propiedad, inquilino…). */
  beforeLabel?: string | null
  afterLabel?: string | null
}

export interface AuditEntryDetail extends AuditEntry {
  changes: AuditChange[]
}

export interface AuditCatalog {
  entities: string[]
  actions: AuditAction[]
}
