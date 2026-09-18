import { Fraunces, Inter } from "next/font/google"

/** Serif clásica para títulos y precios → utilidad `font-serif` / `font-heading`. */
export const fontSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

/** Sans-serif geométrica para cuerpo e interfaz → utilidad `font-sans`. */
export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})
