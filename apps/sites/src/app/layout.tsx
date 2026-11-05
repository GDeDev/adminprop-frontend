import type { Metadata, Viewport } from "next"

import "./globals.css"

// Este layout es el mínimo: cada sitio pone su propio tema, marca y metadatos
// en `s/[site]/layout.tsx`. Acá solo viven los de una página sin sitio.
export const metadata: Metadata = {
  title: "Sitio no disponible",
  robots: { index: false },
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
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
