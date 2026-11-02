import type {
  AuditAction,
  AuditActorKind,
  AuditEntry,
} from "@adminprop/shared-types"

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Alta",
  UPDATE: "Modificación",
  DELETE: "Baja",
  RESTORE: "Restauración",
  LOGIN: "Ingreso",
  LOGIN_FAILED: "Ingreso fallido",
  LOGOUT: "Salida",
  NOTIFICATION_SENT: "Notificación enviada",
  JOB_RUN: "Automatización",
  EXPORT: "Exportación",
}

export const AUDIT_ACTOR_LABELS: Record<AuditActorKind, string> = {
  USER: "Usuario",
  SYSTEM: "Sistema",
  PORTAL_OWNER: "Portal propietario",
  PORTAL_RENTER: "Portal inquilino",
}

/** Quién hizo el cambio, para la tabla: el nombre, el email o el tipo de actor. */
export function auditActor(entry: AuditEntry): string {
  if (entry.actorKind === "USER") {
    return entry.userName ?? entry.userEmail ?? AUDIT_ACTOR_LABELS.USER
  }
  return entry.userEmail
    ? `${AUDIT_ACTOR_LABELS[entry.actorKind]} · ${entry.userEmail}`
    : AUDIT_ACTOR_LABELS[entry.actorKind]
}

/** Valor de un cambio listo para mostrar: etiqueta resuelta, "—" o el valor en texto. */
export function auditValue(value: unknown, label?: string | null): string {
  if (label) return label
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
