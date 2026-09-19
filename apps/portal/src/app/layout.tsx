import type { Metadata, Viewport } from "next"

import "@adminprop/ui/globals.css"
import { cn } from "@adminprop/ui/lib/utils"
import { tenantThemeStyle } from "@adminprop/ui/lib/tenant-theme"

import { display, sans } from "@/lib/fonts"
import { getTenantBranding } from "@/lib/tenant-branding"

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const branding = await getTenantBranding()

  return (
    // suppressHydrationWarning: next-themes pone la clase `dark` antes de hidratar.
    <html
      lang="es"
      className={cn(display.variable, sans.variable)}
      style={tenantThemeStyle(branding?.primaryColor)}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
