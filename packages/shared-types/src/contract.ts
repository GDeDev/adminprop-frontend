import type { ApiSchemas } from "./api"

/**
 * Contratos e índices (PRD 5.5, Fase 9), tal como los devuelve la API.
 * La moneda (`Currency`) ya está en `common.ts` con los mismos valores.
 */

/** Una fila del listado: partes resueltas, alquiler vigente y alertas. */
export type ContractSummary = ApiSchemas["ContractSummaryDto"]
/** La ficha: además condiciones, caución, rescisión, historial y línea de tiempo. */
export type ContractDetail = ApiSchemas["ContractDetailDto"]
export type ContractPropertyRef = ApiSchemas["ContractPropertyRefDto"]
export type ContractPartyRef = ApiSchemas["ContractPartyRefDto"]
export type ContractSurety = ApiSchemas["ContractSuretyDto"]
export type ContractTermination = ApiSchemas["ContractTerminationDto"]
export type ContractRentUpdate = ApiSchemas["ContractRentUpdateDto"]
export type ContractTimeline = ApiSchemas["ContractTimelineDto"]

export type ContractStatus = ContractSummary["status"]
export type RentUpdateType = ContractDetail["rentUpdateType"]
export type RentUpdateFrequency = ContractDetail["rentUpdateFrequency"]
export type RentUpdateSource = ContractRentUpdate["source"]

export type CreateContractRequest = ApiSchemas["CreateContractDto"]
export type UpdateContractRequest = ApiSchemas["UpdateContractDto"]
export type ContractSuretyRequest = ApiSchemas["PartialSuretyDto"]
export type RenewContractRequest = ApiSchemas["RenewContractDto"]
export type ApplyRentUpdateRequest = ApiSchemas["ApplyRentUpdateDto"]
export type TerminateContractRequest = ApiSchemas["TerminateContractDto"]

/** `GET /contracts/:id/termination-preview`: la multa sin rescindir. */
export type TerminationPreview = ApiSchemas["TerminationPreviewDto"]
/** `POST /contracts/:id/terminate`: el desglose más el contrato rescindido. */
export type TerminationResult = ApiSchemas["TerminationResultDto"]

/** Valores mensuales de ICL/IPC, globales a todas las inmobiliarias. */
export type IndexValue = ApiSchemas["IndexValueDto"]
export type IndexType = IndexValue["indexType"]
export type RegisterIndexValueRequest = ApiSchemas["RegisterIndexValueDto"]
