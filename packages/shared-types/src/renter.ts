import type { ApiSchemas } from "./api"

/**
 * Inquilinos y garantes (PRD 5.3 y 5.4, Fase 8), tal como los devuelve la
 * API. "Renter" en código para no chocar con "Tenant" (la inmobiliaria).
 */

export type RenterSummary = ApiSchemas["RenterSummaryDto"]
export type RenterDetail = ApiSchemas["RenterDetailDto"]
export type RenterRef = ApiSchemas["RenterRefDto"]
/** El garante como lo muestra la ficha del inquilino. */
export type RenterGuarantor = ApiSchemas["RenterGuarantorDto"]
/** Estado de pago del inquilino; `null` hasta que exista el motor de cobros. */
export type RenterPaymentStatus = NonNullable<RenterSummary["paymentStatus"]>

export type CreateRenterRequest = ApiSchemas["CreateRenterDto"]
export type UpdateRenterRequest = ApiSchemas["UpdateRenterDto"]
export type RenterDataCheck = ApiSchemas["RenterDataCheckDto"]

export type GuarantorSummary = ApiSchemas["GuarantorSummaryDto"]
export type GuarantorDetail = ApiSchemas["GuarantorDetailDto"]
export type GuarantorRef = ApiSchemas["GuarantorRefDto"]
export type GuaranteeType = GuarantorSummary["guaranteeType"]

export type CreateGuarantorRequest = ApiSchemas["CreateGuarantorDto"]
export type UpdateGuarantorRequest = ApiSchemas["UpdateGuarantorDto"]
export type GuarantorDataCheck = ApiSchemas["GuarantorDataCheckDto"]
