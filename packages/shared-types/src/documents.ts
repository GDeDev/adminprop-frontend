import type { IsoDateTime, Uuid } from "./common"

/** Documentos PDF generados por la API (rediseño Fase 15, sección 7). */
export type DocumentKind =
  "SETTLEMENT" | "OWNER_STATEMENT" | "PAYMENT_RECEIPT" | "TERMINATION_NOTICE"

export type DocumentStatus = "PENDING" | "READY" | "FAILED"

export interface GeneratedDocument {
  id: Uuid
  kind: DocumentKind
  entityId: Uuid
  version: number
  status: DocumentStatus
  url: string | null
  sizeBytes: number | null
  error: string | null
  generatedAt: IsoDateTime | null
  requestedBy: { id: Uuid; fullName: string } | null
  createdAt: IsoDateTime
}

/** `GET /tenants/current/settings` (admin). */
export interface TenantSettings {
  id: Uuid
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  legalName: string | null
  taxId: string | null
  address: string | null
  phone: string | null
  email: string | null
  whatsapp: string | null
  bankAccountHolder: string | null
  bankName: string | null
  bankCbu: string | null
  bankAlias: string | null
  documentFooter: string | null
  receiptSequence: number
}

/** Todos opcionales; `null` borra el valor. */
export type UpdateTenantSettingsRequest = Partial<
  Omit<TenantSettings, "id" | "slug" | "logoUrl" | "receiptSequence">
>
