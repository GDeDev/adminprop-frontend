import type { CSSProperties } from "react"

import type { SiteTheme } from "@adminprop/shared-types"

const HEX = /^#[0-9a-fA-F]{6}$/

/** Pilas del sistema: sin descargar fuentes (rendimiento y privacidad). */
export const FONT_STACKS: Record<string, string> = {
  system:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif:
    'ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif',
  humanist:
    'Seravek, "Gill Sans Nova", "Gill Sans", Calibri, "Trebuchet MS", ui-sans-serif, sans-serif',
  rounded:
    'ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", Quicksand, Nunito, "Varela Round", ui-sans-serif, sans-serif',
}

const DEFAULT_FONT = FONT_STACKS.system as string

const FALLBACK: SiteTheme = {
  primary: "#1D4ED8",
  secondary: "#475569",
  background: "#FFFFFF",
  surface: "#F1F5F9",
  text: "#0F172A",
  fontKey: "system",
  radius: 16,
}

function channel(value: number): number {
  const v = value / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/** Luminancia relativa WCAG de un `#RRGGBB`. */
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  )
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Blanco o casi negro: lo que mejor se lee sobre `background`. */
export function onColor(background: string): string {
  return contrastRatio("#FFFFFF", background) >=
    contrastRatio("#111111", background)
    ? "#FFFFFF"
    : "#111111"
}

const color = (value: unknown, fallback: string): string =>
  typeof value === "string" && HEX.test(value) ? value.toUpperCase() : fallback

/**
 * Variables CSS del tema. Los valores se validan acá otra vez (hex, radio de la
 * lista, fuente de la lista cerrada) aunque la API ya lo haga: lo que termina
 * en un atributo `style` nunca es texto libre.
 */
export function themeStyle(theme: SiteTheme): CSSProperties {
  const primary = color(theme.primary, FALLBACK.primary)
  const secondary = color(theme.secondary, FALLBACK.secondary)
  const background = color(theme.background, FALLBACK.background)
  const surface = color(theme.surface, FALLBACK.surface)
  const text = color(theme.text, FALLBACK.text)
  const radius = [0, 8, 16, 24].includes(theme.radius)
    ? theme.radius
    : FALLBACK.radius

  const vars: Record<string, string> = {
    "--site-primary": primary,
    "--site-on-primary": onColor(primary),
    "--site-secondary": secondary,
    "--site-on-secondary": onColor(secondary),
    "--site-background": background,
    "--site-surface": surface,
    "--site-text": text,
    "--site-radius": `${radius}px`,
    "--site-font": FONT_STACKS[theme.fontKey] ?? DEFAULT_FONT,
  }
  return vars as CSSProperties
}
