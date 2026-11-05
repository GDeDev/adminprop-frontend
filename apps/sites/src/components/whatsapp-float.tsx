import { WhatsAppGlyph } from "@/components/icons"

/** Botón flotante de WhatsApp; no se muestra si el sitio no cargó número. */
export function WhatsAppFloat({ href }: { href: string | null }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="bg-site-primary text-site-on-primary fixed right-4 bottom-4 z-50 inline-flex size-14 items-center justify-center rounded-full shadow-lg"
    >
      <WhatsAppGlyph className="size-7" />
    </a>
  )
}
