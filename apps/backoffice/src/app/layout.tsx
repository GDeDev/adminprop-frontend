import type { Metadata, Viewport } from "next"

import "@adminprop/ui/globals.css"
import { cn } from "@adminprop/ui/lib/utils"

import { fontSans, fontSerif } from "@/lib/fonts"

import { Providers } from "./providers"

export const metadata: Metadata = {
  title: {
    default: "Adminprop",
    template: "%s · Adminprop",
  },
  description: "Gestión inmobiliaria",
  robots: { index: false, follow: false },
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
    <html lang="es" className={cn(fontSans.variable, fontSerif.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
