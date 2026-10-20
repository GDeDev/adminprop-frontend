import type { ApiSchemas } from "./api"

/**
 * Servicios de una propiedad y gastos adelantados (PRD 5.7, Fase 10), tal
 * como los devuelve la API. `ServiceType` (el maestro) sigue en
 * `master-data.ts`; acá va la referencia resuelta en cada servicio.
 */

/** Un servicio de la propiedad o de uno de sus contratos, con el estado calculado. */
export type PropertyService = ApiSchemas["PropertyServiceDto"]
/** Lo mismo, visto desde el contrato: `scope` dice si es propio o heredado. */
export type ContractService = ApiSchemas["ContractServiceDto"]
/** Un vencido del dashboard, con la propiedad para el link. */
export type OverdueService = ApiSchemas["OverdueServiceDto"]
export type ServiceTypeRef = ApiSchemas["ServiceTypeRefDto"]
export type ServicePropertyRef = ApiSchemas["ServicePropertyRefDto"]

export type ServicePayer = PropertyService["paidBy"]
export type ServiceStatus = PropertyService["status"]
export type ServiceScope = ContractService["scope"]
/** Mismos valores que `RentUpdateFrequency`; la API los expone por separado. */
export type IncreaseFrequency = NonNullable<
  PropertyService["increaseFrequency"]
>

export type CreateServiceRequest = ApiSchemas["CreateServiceDto"]
export type UpdateServiceRequest = ApiSchemas["UpdateServiceDto"]

/** Un gasto que el inquilino adelantó, con su comprobante; inmutable una vez descontado. */
export type AdvanceExpense = ApiSchemas["AdvanceExpenseDto"]
/** `GET /contracts/:id/advance-expenses`: los ítems más los totales del contrato. */
export type AdvanceExpenseList = ApiSchemas["AdvanceExpenseListDto"]
export type AdvanceExpenseRegisteredBy =
  ApiSchemas["AdvanceExpenseRegisteredByDto"]
export type UpdateAdvanceExpenseRequest = ApiSchemas["UpdateAdvanceExpenseDto"]
