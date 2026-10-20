/**
 * Parte server de la sesión: route handlers (BFF) y lectura de cookies para
 * el proxy y los layouts. Nunca importarlo desde un componente cliente.
 */
export {
  createSessionRoutes,
  secondsUntilExpiry,
  type RefreshedSession,
  type SessionRouteOptions,
} from "./session-routes"
export {
  brandingCookieName,
  decodeBranding,
  refreshCookieName,
  type StoredBranding,
} from "./cookies"
