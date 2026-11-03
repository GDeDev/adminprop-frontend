import { Mail, MapPin, MessageCircle, Phone } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"

import { whatsappUrl } from "@/lib/format"
import { getTenantBranding } from "@/lib/tenant-branding"

/** Pie del sitio público: datos de contacto de la inmobiliaria y WhatsApp. */
export async function PublicFooter() {
  const branding = await getTenantBranding()
  if (!branding) return null
  const hasContact =
    branding.phone || branding.email || branding.address || branding.whatsapp

  return (
    <footer className="mt-8 border-t bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-display text-lg font-semibold">{branding.name}</p>
          {hasContact ? (
            <ul className="flex flex-col gap-1 text-sidebar-muted">
              {branding.phone && (
                <li className="flex items-center gap-2">
                  <Phone aria-hidden className="size-4" />
                  <a href={`tel:${branding.phone}`} className="hover:underline">
                    {branding.phone}
                  </a>
                </li>
              )}
              {branding.email && (
                <li className="flex items-center gap-2">
                  <Mail aria-hidden className="size-4" />
                  <a
                    href={`mailto:${branding.email}`}
                    className="hover:underline"
                  >
                    {branding.email}
                  </a>
                </li>
              )}
              {branding.address && (
                <li className="flex items-center gap-2">
                  <MapPin aria-hidden className="size-4" />
                  <span>{branding.address}</span>
                </li>
              )}
            </ul>
          ) : null}
        </div>
        {branding.whatsapp && (
          <Button asChild variant="secondary">
            <a
              href={whatsappUrl(
                branding.whatsapp,
                "Hola, quiero consultar por una propiedad."
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden />
              Consultar por WhatsApp
            </a>
          </Button>
        )}
      </div>
    </footer>
  )
}
