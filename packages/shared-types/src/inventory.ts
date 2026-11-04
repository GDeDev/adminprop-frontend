import type { ApiSchemas } from "./api"

/** Inventario de entrega y devolución (Fase 25), tal como lo devuelve la API. */
export type InventoryPhoto = ApiSchemas["InventoryPhotoDto"]
export type InventoryItem = ApiSchemas["InventoryItemDto"]
export type InventorySummary = ApiSchemas["InventorySummaryDto"]
export type InventoryDetail = ApiSchemas["InventoryDetailDto"]
export type ContractInventories = ApiSchemas["ContractInventoriesDto"]
export type InventoryComparisonRow = ApiSchemas["InventoryComparisonRowDto"]
export type InventoryComparison = ApiSchemas["InventoryComparisonDto"]

export type InventoryType = InventorySummary["type"]
export type InventoryStatus = InventorySummary["status"]
export type ItemCondition = InventoryItem["condition"]
export type InventoryChange = InventoryComparisonRow["change"]

export type CreateInventoryRequest = ApiSchemas["CreateInventoryDto"]
export type UpdateInventoryItemRequest = ApiSchemas["InventoryItemInputDto"]
export type UpdateInventoryRequest = ApiSchemas["UpdateInventoryDto"]
