/**
 * Utilidades de color para verificar contraste (WCAG 2.x) sobre los tokens
 * del sistema de diseño, que están en OKLCH (v2) o hex (v1 y tema por
 * inmobiliaria). Se usan en los tests; no hay colores que calcular en runtime.
 */

export type Rgb = [number, number, number]

/** Canal sRGB de 0 a 1 → lineal. */
function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Lineal → canal sRGB de 0 a 1 (con recorte al gamut). */
function toGamma(c: number): number {
  const clamped = Math.min(1, Math.max(0, c))
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * clamped ** (1 / 2.4) - 0.055
}

/** OKLCH (L 0..1, C, h en grados) → sRGB lineal sin recortar. */
export function oklchToLinearRgb(l: number, c: number, h: number): Rgb {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b

  const L = l_ ** 3
  const M = m_ ** 3
  const S = s_ ** 3

  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ]
}

export interface ParsedColor {
  /** sRGB lineal, recortado al gamut. */
  linear: Rgb
  alpha: number
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const OKLCH =
  /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/i

/** Acepta `#rgb`, `#rrggbb` y `oklch(L C H [/ alpha])`. */
export function parseColor(value: string): ParsedColor {
  const text = value.trim()

  const hex = HEX.exec(text)
  if (hex) {
    const digits = hex[1]!
    const full =
      digits.length === 3
        ? digits
            .split("")
            .map((d) => d + d)
            .join("")
        : digits
    const channels = [0, 2, 4].map((i) =>
      toLinear(parseInt(full.slice(i, i + 2), 16) / 255)
    ) as Rgb
    return { linear: channels, alpha: 1 }
  }

  const ok = OKLCH.exec(text)
  if (ok) {
    const l = ok[2] ? Number(ok[1]) / 100 : Number(ok[1])
    const raw = oklchToLinearRgb(l, Number(ok[3]), Number(ok[4]))
    // Recorte por canal (suficiente para validar contraste de tokens en gamut).
    const linear = raw.map((c) => Math.min(1, Math.max(0, c))) as Rgb
    const alpha =
      ok[5] === undefined ? 1 : ok[6] ? Number(ok[5]) / 100 : Number(ok[5])
    return { linear, alpha }
  }

  throw new Error(`Color no soportado: "${value}"`)
}

/** Compone `top` (con alfa) sobre `bottom` opaco. Devuelve un color opaco. */
export function composite(top: ParsedColor, bottom: ParsedColor): ParsedColor {
  // Se mezcla en sRGB con gamma, como hace el navegador por defecto.
  const mixed = top.linear.map((channel, i) => {
    const t = toGamma(channel)
    const b = toGamma(bottom.linear[i]!)
    const out = t * top.alpha + b * (1 - top.alpha)
    return toLinear(out)
  }) as Rgb
  return { linear: mixed, alpha: 1 }
}

/** Luminancia relativa WCAG de un color opaco. */
export function luminance(color: ParsedColor): number {
  const [r, g, b] = color.linear
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Relación de contraste WCAG entre `foreground` y `background`. Si el texto
 * tiene alfa se compone sobre el fondo; el fondo debe ser opaco.
 */
export function contrastRatio(foreground: string, background: string): number {
  const bg = parseColor(background)
  if (bg.alpha < 1) {
    throw new Error(`El fondo "${background}" tiene que ser opaco`)
  }
  const fgParsed = parseColor(foreground)
  const fg = fgParsed.alpha < 1 ? composite(fgParsed, bg) : fgParsed
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}
