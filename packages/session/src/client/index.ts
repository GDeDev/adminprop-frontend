/**
 * Parte cliente de la sesión: access token en memoria, refresh silencioso y
 * protección de rutas. Los route handlers están en `@adminprop/session/server`.
 */
export {
  createApiClient,
  redirectToLogin,
  safeNextPath,
  type ApiClientOptions,
} from "./api-client"
export { apiErrorCode, apiErrorMessage, apiFieldErrors } from "./api-error"
export { ProtectedRoute, type ProtectedRouteProps } from "./protected-route"
export {
  DEFAULT_SESSION_PATH,
  endSession,
  refreshAccessToken,
  startSession,
  type RefreshResult,
} from "./session-client"
export {
  SessionProvider,
  useSession,
  type SessionContextValue,
  type SessionProviderProps,
  type SessionStatus,
} from "./session-provider"
export { tokenStore } from "./token-store"
