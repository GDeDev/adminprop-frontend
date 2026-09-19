import type { Metadata, Viewport } from "next"

import "@adminprop/ui/globals.css"
import { cn } from "@adminprop/ui/lib/utils"

import { display, sans } from "@/lib/fonts"

import { Providers } from "./providers"

// TODO(multi-tenant): nombre y descripción salen del Tenant resuelto por dominio.
export const metadata: Metadata = {
  title: {
    default: "Propiedades en alquiler",
    template: "%s · Propiedades en alquiler",
  },
  description: "Propiedades disponibles para alquilar.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={cn(display.variable, sans.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
