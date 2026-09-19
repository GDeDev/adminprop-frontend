import { Figtree, Outfit } from "next/font/google"

// Fuentes del sistema de diseño (ADMINPROP-UI.md, "Setup").

/** Títulos y montos → utilidad `font-display`. */
export const display = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

/** Cuerpo e interfaz → utilidad `font-sans` (la default del body). */
export const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
})
