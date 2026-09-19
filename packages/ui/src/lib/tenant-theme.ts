import type * as React from "react"

/**
 * Tema por inmobiliaria (ADMINPROP-UI.md, "Tema por inmobiliaria"): lo único
 * que cambia por cliente es `--primary` y `--primary-foreground`, pisados en
 * el `<html>` desde el server. Ningún componente se entera.
 *
 * `primaryColor` es `Tenant.primaryColor` de la API (hex, puede ser null).
 * Si falta o no es un hex válido se usa el primary del sistema de diseño.
 */

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

// El texto sobre el primary sale de tokens que son claros (u oscuros) en los
// dos modos, así el contraste no depende de si el usuario está en modo oscuro.
const LIGHT_FOREGROUND = "var(--sidebar-foreground)"
const DARK_FOREGROUND = "var(--sidebar)"

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value)
}

function toRgb(hex: string): [number, number, number] {
  const digits = hex.slice(1)
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((d) => d + d)
          .join("")
      : digits
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ]
}

/** Luminancia relativa WCAG 2.x, de 0 (negro) a 1 (blanco). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * `true` si sobre ese color se lee mejor texto claro que oscuro (compara el
 * contraste WCAG contra blanco y contra negro).
 */
export function prefersLightForeground(hex: string): boolean {
  const l = relativeLuminance(hex)
  const contrastWithWhite = 1.05 / (l + 0.05)
  const contrastWithBlack = (l + 0.05) / 0.05
  return contrastWithWhite >= contrastWithBlack
}

/**
 * Estilo para el `<html>` con el color de la inmobiliaria. Devuelve
 * `undefined` si no hay color válido (queda el tema default).
 */
export function tenantThemeStyle(
  primaryColor: string | null | undefined
): React.CSSProperties | undefined {
  const color = primaryColor?.trim()
  if (!color || !isHexColor(color)) return undefined

  return {
    "--primary": color,
    "--primary-foreground": prefersLightForeground(color)
      ? LIGHT_FOREGROUND
      : DARK_FOREGROUND,
  } as React.CSSProperties
}
