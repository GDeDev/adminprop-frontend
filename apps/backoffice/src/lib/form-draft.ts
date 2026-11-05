/**
 * Borradores de formularios en `localStorage`.
 *
 * Es un navegador que puede compartirse (PC de la inmobiliaria), así que el
 * borrador es lo más acotado posible:
 *
 * - **Vence** (`DRAFT_TTL_MS`): pasado ese tiempo se ignora y se borra.
 * - **No guarda datos sensibles**: los campos que el formulario declara en
 *   `omit` (notas, datos de póliza) y, por si se agrega alguno nuevo, cualquier
 *   clave con aspecto de documento, CBU, alias o credencial.
 * - **Se borra al cerrar sesión** (`clearAllDrafts`, desde `onSignOut`).
 */
export const DRAFT_TTL_MS = 8 * 60 * 60 * 1000

const DRAFT_KEY_PATTERN = /^adminprop:[a-z-]+-draft$/

/** Claves que nunca se guardan, aunque el formulario no las haya excluido. */
const SENSITIVE_KEY =
  /dni|cuit|cuil|cbu|cvu|alias|iban|password|contrase|token|secret|policy|insurer/i

interface Envelope {
  savedAt: number
  data: unknown
}

function strip(value: unknown, omit: ReadonlySet<string>): unknown {
  if (Array.isArray(value)) return value.map((item) => strip(item, omit))
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !omit.has(key) && !SENSITIVE_KEY.test(key))
        .map(([key, item]) => [key, strip(item, omit)])
    )
  }
  return value
}

export function saveDraft(
  key: string,
  values: unknown,
  omit: readonly string[] = [],
  now = Date.now()
): void {
  try {
    const envelope: Envelope = {
      savedAt: now,
      data: strip(values, new Set(omit)),
    }
    window.localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    // Sin storage (modo privado): el formulario funciona igual, sin borrador.
  }
}

/** El contenido del borrador, o `null` si no hay, venció o está dañado. */
export function loadDraft(key: string, now = Date.now()): unknown {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const envelope = JSON.parse(raw) as Partial<Envelope> | null
    if (
      !envelope ||
      typeof envelope.savedAt !== "number" ||
      now - envelope.savedAt > DRAFT_TTL_MS ||
      envelope.savedAt > now
    ) {
      window.localStorage.removeItem(key)
      return null
    }
    return envelope.data ?? null
  } catch {
    return null
  }
}

export function removeDraft(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // nada que borrar
  }
}

/** Borra todos los borradores de la app (cierre de sesión). */
export function clearAllDrafts(): void {
  try {
    const storage = window.localStorage
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i)
      if (key && DRAFT_KEY_PATTERN.test(key)) storage.removeItem(key)
    }
  } catch {
    // sin storage no hay borradores que borrar
  }
}
