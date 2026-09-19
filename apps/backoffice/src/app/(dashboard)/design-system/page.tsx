import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DesignSystemShowcase } from "./showcase"

export const metadata: Metadata = { title: "Sistema de diseño" }

/**
 * Vitrina del sistema de diseño para revisar a ojo tokens, componentes, modo
 * oscuro y tema por inmobiliaria. Solo en desarrollo: en producción da 404.
 */
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound()
  return <DesignSystemShowcase />
}
