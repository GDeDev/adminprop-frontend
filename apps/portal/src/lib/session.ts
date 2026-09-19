import type { PortalRole, PortalType } from "@adminprop/shared-types"

/**
 * Configuración de la sesión del portal. El prefijo distingue sus cookies de
 * las del backoffice (en localhost comparten cookies entre puertos).
 *
 * Una sola sesión para las dos áreas: quien entra como inquilino y después
 * como propietario reemplaza la sesión anterior.
 */
export const SESSION_COOKIE_PREFIX = "adminprop_portal"

interface PortalArea {
  basePath: string
  loginPath: string
  homePath: string
  /** El `type` de `POST /auth/portal-login` y el rol que tiene que tener el usuario. */
  apiType: PortalType
}

export const PORTAL_AREAS: Record<PortalRole, PortalArea> = {
  owner: {
    basePath: "/propietario",
    loginPath: "/propietario/login",
    homePath: "/propietario/propiedades",
    apiType: "OWNER",
  },
  renter: {
    basePath: "/inquilino",
    loginPath: "/inquilino/login",
    homePath: "/inquilino/cuenta",
    apiType: "RENTER",
  },
}

/** Área logueada a la que pertenece una ruta, o `null` si es pública. */
export function areaForPath(pathname: string): PortalRole | null {
  for (const [role, area] of Object.entries(PORTAL_AREAS)) {
    if (
      pathname === area.basePath ||
      pathname.startsWith(`${area.basePath}/`)
    ) {
      return role as PortalRole
    }
  }
  return null
}
