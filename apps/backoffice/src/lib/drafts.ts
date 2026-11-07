import { useSession } from "@adminprop/session/client"

/**
 * Borradores de formularios en `localStorage` (alta de contratos y de
 * propiedades). La clave lleva la inmobiliaria y el usuario: en una PC
 * compartida, quien entra después no retoma lo que dejó otro. Y al cerrar
 * sesión se borran todos (`clearDrafts`, desde `onSignOut`).
 */
const PREFIX = "adminprop:"

export type DraftName = "contract" | "property"

interface DraftOwner {
  id: string
  tenantId: string
}

export function draftKey(
  name: DraftName,
  owner: DraftOwner | null | undefined
): string | null {
  if (!owner) return null
  return `${PREFIX}${name}-draft:${owner.tenantId}:${owner.id}`
}

/** Clave del borrador del usuario logueado, o `null` si todavía no hay. */
export function useDraftKey(name: DraftName): string | null {
  const { user } = useSession()
  return draftKey(name, user)
}

/** Borra todos los borradores (incluidos los viejos sin usuario en la clave). */
export function clearDrafts(storage?: Storage): void {
  try {
    const target =
      storage ?? (typeof window === "undefined" ? null : window.localStorage)
    if (!target) return
    const keys: string[] = []
    for (let i = 0; i < target.length; i++) {
      const key = target.key(i)
      if (key?.startsWith(PREFIX) && key.includes("-draft")) keys.push(key)
    }
    keys.forEach((key) => target.removeItem(key))
  } catch {
    // Sin storage (modo privado): no hay nada que borrar.
  }
}
