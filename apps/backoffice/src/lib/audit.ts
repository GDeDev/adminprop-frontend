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

/** Nombre en español de cada entidad auditada (mismo criterio que la API). */
export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Tenant: "Inmobiliaria",
  User: "Usuario",
  Location: "Localidad",
  PropertyType: "Tipo de propiedad",
  Amenity: "Comodidad",
  OperationType: "Tipo de operación",
  ServiceType: "Tipo de servicio",
  Property: "Propiedad",
  Owner: "Propietario",
  Renter: "Inquilino",
  Guarantor: "Garante",
  Contract: "Contrato",
  ContractBillingTerms: "Condiciones de cobro del contrato",
  PropertyService: "Servicio de la propiedad",
  AdvanceExpense: "Gasto adelantado",
  Installment: "Cuota",
  InstallmentCharge: "Cargo de la cuota",
  Payment: "Pago",
  LateFeeAdjustment: "Ajuste de punitorio",
  RenterCredit: "Saldo a favor",
  DepositReturn: "Devolución de depósito",
  DepositReturnDeduction: "Descuento del depósito",
  Settlement: "Liquidación",
  SettlementAdjustment: "Ajuste de liquidación",
  SettlementTransfer: "Transferencia al propietario",
  OwnerStatement: "Consolidado",
  FeeReceivable: "Honorario a cobrar",
  FeePayment: "Pago de honorarios",
  GeneratedDocument: "Documento",
  Notification: "Aviso",
  Job: "Tarea automática",
  Report: "Reporte",
  Audit: "Auditoría",
  ImportBatch: "Lote de migración",
  PropertyInventory: "Inventario",
}

export function auditEntityLabel(entity: string): string {
  return AUDIT_ENTITY_LABELS[entity] ?? entity
}

/** Nombre en español de los campos más comunes del diff; el resto se "humaniza". */
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  status: "Estado",
  address: "Dirección",
  firstName: "Nombre",
  lastName: "Apellido",
  fullName: "Nombre completo",
  email: "Email",
  phone: "Teléfono",
  nationalId: "DNI",
  amount: "Importe",
  baseAmount: "Importe base",
  paidAmount: "Importe pagado",
  rent: "Alquiler",
  rentAmount: "Alquiler",
  currency: "Moneda",
  period: "Período",
  endDate: "Fecha de fin",
  startDate: "Fecha de inicio",
  dueDate: "Vencimiento",
  paidAt: "Fecha de pago",
  notes: "Notas",
  deletedAt: "Baja",
  feePercentage: "Porcentaje de honorarios",
  isActive: "Activo",
  role: "Rol",
  propertyId: "Propiedad",
  ownerId: "Propietario",
  renterId: "Inquilino",
  contractId: "Contrato",
  listingPrice: "Precio de publicación",
  listingCurrency: "Moneda de publicación",
  publicDescription: "Descripción pública",
  propertyTypeId: "Tipo de propiedad",
  locationId: "Localidad",
  method: "Medio de pago",
  reason: "Motivo",
  name: "Nombre",
  cbu: "CBU",
  alias: "Alias",
  collectionMode: "Quién cobra",
  paymentMethod: "Medio de pago",
}

/** "baseAmount" → "Importe base"; sin traducción, "baseAmount" → "Base amount" legible. */
export function auditFieldLabel(field: string): string {
  const known = AUDIT_FIELD_LABELS[field]
  if (known) return known
  const spaced = field.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** Ficha de la entidad, si tiene una pantalla propia. */
export function auditEntityHref(
  entity: string,
  id: string | null
): string | null {
  if (!id) return null
  const base: Record<string, string> = {
    Property: "/propiedades",
    Owner: "/propietarios",
    Renter: "/inquilinos",
    Guarantor: "/garantes",
    Contract: "/contratos",
    Installment: "/cobros",
    Settlement: "/liquidaciones",
    OwnerStatement: "/liquidaciones/consolidados",
  }
  return base[entity] ? `${base[entity]}/${id}` : null
}
