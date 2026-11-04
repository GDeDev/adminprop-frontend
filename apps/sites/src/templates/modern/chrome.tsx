import { MessageCircle } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { SocialLink } from "@/components/icons"
import { MobileMenu } from "@/components/mobile-menu"
import { navLinks } from "@/lib/site-links"
import { hrefFor } from "@/lib/site-route"
import { mailtoHref } from "@/lib/safe-links"
import { telLink, whatsappLink } from "@/lib/whatsapp"

import type { SiteProps } from "../types"

/** MODERN: barra mínima y limpia, con un botón de contacto. */
export function ModernHeader({ site, route }: SiteProps) {
  const links = navLinks(site, route)
  const cta = links.at(-1)
  return (
    <header className="border-site-border bg-site-bg/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a
          href={hrefFor(route, "/")}
          aria-label={`${site.content.brand.displayName}, ir al inicio`}
          className="flex min-h-11 items-center"
        >
          <BrandMark site={site} textClassName="text-2xl tracking-tight" />
        </a>
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.slice(0, -1).map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="hover:bg-site-surface inline-flex min-h-11 items-center rounded-full px-4 font-medium"
                >
                  {link.label}
                </a>
              </li>
            ))}
            {cta && (
              <li>
                <a
                  href={cta.href}
                  className="bg-site-primary text-site-on-primary ml-2 inline-flex min-h-11 items-center rounded-full px-5 font-semibold"
                >
                  {cta.label}
                </a>
              </li>
            )}
          </ul>
        </nav>
        <MobileMenu links={links} />
      </div>
    </header>
  )
}

export function ModernFooter({ site, route }: SiteProps) {
  const { contact, brand } = site.content
  const links = navLinks(site, route)
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage)
  const tel = telLink(contact.phone)

  return (
    <footer className="bg-site-surface mt-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <BrandMark site={site} textClassName="text-2xl tracking-tight" />
          {brand.tagline && (
            <p className="text-site-muted max-w-sm">{brand.tagline}</p>
          )}
          {contact.socials.length > 0 && (
            <ul className="flex gap-2">
              {contact.socials.map((social) => (
                <li key={social.network}>
                  <SocialLink
                    network={social.network}
                    url={social.url}
                    className="bg-site-bg hover:bg-site-primary hover:text-site-on-primary inline-flex size-11 items-center justify-center rounded-full"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Pie de página">
          <h2 className="mb-3 font-semibold">Navegación</h2>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-11 items-center hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <address className="space-y-1 not-italic">
          <h2 className="mb-3 font-semibold">Contacto</h2>
          {contact.address && <p>{contact.address}</p>}
          {contact.hours && <p className="text-site-muted">{contact.hours}</p>}
          {tel && (
            <p>
              <a
                href={tel}
                className="inline-flex min-h-11 items-center hover:underline"
              >
                {contact.phone}
              </a>
            </p>
          )}
          {mailtoHref(contact.email) && (
            <p>
              <a
                href={mailtoHref(contact.email) ?? undefined}
                className="inline-flex min-h-11 items-center break-all hover:underline"
              >
                {contact.email}
              </a>
            </p>
          )}
          {wa && (
            <p>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 hover:underline"
              >
                <MessageCircle aria-hidden className="size-4" />
                WhatsApp
              </a>
            </p>
          )}
        </address>
      </div>
      <p className="text-site-muted px-4 pb-8 text-center text-sm">
        © {new Date().getFullYear()} {brand.displayName}
      </p>
    </footer>
  )
}
