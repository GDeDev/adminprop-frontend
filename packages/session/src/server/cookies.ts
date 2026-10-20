import type { TenantBranding } from "@adminprop/shared-types"

/** Cookie httpOnly con el refresh token. */
export const refreshCookieName = (prefix: string) => `${prefix}_rt`

/** Cookie httpOnly con la marca de la inmobiliaria (no es un secreto). */
export const brandingCookieName = (prefix: string) => `${prefix}_brand`

/** Lo que se guarda de la marca: lo justo para el layout. */
export type StoredBranding = Pick<
  TenantBranding,
  "name" | "logoUrl" | "primaryColor"
>

export function encodeBranding(branding: TenantBranding): string {
  const stored: StoredBranding = {
    name: branding.name,
    logoUrl: branding.logoUrl,
    primaryColor: branding.primaryColor,
  }
  return encodeURIComponent(JSON.stringify(stored))
}

/** `null` si falta o está corrupta: el layout usa el tema por defecto. */
export function decodeBranding(
  value: string | undefined
): StoredBranding | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(
      decodeURIComponent(value)
    ) as Partial<StoredBranding>
    if (typeof parsed.name !== "string") return null
    return {
      name: parsed.name,
      logoUrl: typeof parsed.logoUrl === "string" ? parsed.logoUrl : null,
      primaryColor:
        typeof parsed.primaryColor === "string" ? parsed.primaryColor : null,
    }
  } catch {
    return null
  }
}
