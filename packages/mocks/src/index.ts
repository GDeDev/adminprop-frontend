/**
 * Fixtures DESCARTABLES para maquetar sin backend.
 *
 * Cuando exista el endpoint real de un módulo, se reemplaza el uso del mock
 * por la query de TanStack Query contra la API, y este paquete se va
 * vaciando hasta poder borrarse.
 */
export * from "./ids"
export * from "./tenant"
export * from "./master-data"
export * from "./owners"
export * from "./renters"
export * from "./properties"
export * from "./contracts"
export * from "./latency"
