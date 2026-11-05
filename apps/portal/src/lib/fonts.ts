import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"

// Fuentes del sistema de diseño v2 (ADMINPROP-UI-v2.md, "Tipografía").
// Si no se pueden descargar (sin red), los tokens caen a la pila de sistema
// definida en `--font-sans`, `--font-display` y `--font-mono`.

/** Títulos y cifras grandes → utilidad `font-display`. */
export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  axes: ["opsz"],
})

/** Cuerpo e interfaz → utilidad `font-sans` (la default del body). */
export const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

/** Datos técnicos y códigos → utilidad `font-mono`. */
export const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
})
