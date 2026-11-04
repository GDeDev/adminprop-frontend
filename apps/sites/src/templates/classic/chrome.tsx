import { Clock, MapPin, MessageCircle } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { SocialLink } from "@/components/icons"
import { MobileMenu } from "@/components/mobile-menu"
import { navLinks } from "@/lib/site-links"
import { hrefFor } from "@/lib/site-route"
import { mailtoHref } from "@/lib/safe-links"
import { telLink, whatsappLink } from "@/lib/whatsapp"

import type { SiteProps } from "../types"

/** CLASSIC: barra con dirección y horarios + navegación fija con el logo. */
export function ClassicHeader({ site, route }: SiteProps) {
  const { contact } = site.content
  const links = navLinks(site, route)
  const hasInfo = contact.address || contact.hours

  return (
    <header className="border-site-border bg-site-bg/95 sticky top-0 z-40 border-b backdrop-blur">
      {hasInfo && (
        <div className="border-site-border bg-site-surface hidden border-b text-sm md:block">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2">
            {contact.address && (
              <p className="flex items-center gap-2">
                <MapPin aria-hidden className="text-site-primary size-4" />
                {contact.address}
              </p>
            )}
            {contact.hours && (
              <p className="flex items-center gap-2">
                <Clock aria-hidden className="text-site-primary size-4" />
                {contact.hours}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <a
          href={hrefFor(route, "/")}
          aria-label={`${site.content.brand.displayName}, ir al inicio`}
          className="flex min-h-11 items-center"
        >
          <BrandMark site={site} textClassName="tracking-wide uppercase" />
        </a>
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="hover:text-site-primary inline-flex min-h-11 items-center px-4 text-sm font-medium tracking-wide uppercase"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <MobileMenu links={links} />
      </div>
    </header>
  )
}

export function ClassicFooter({ site, route }: SiteProps) {
  const { contact, brand } = site.content
  const links = navLinks(site, route)
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage)
  const tel = telLink(contact.phone)

  return (
    <footer className="border-site-border bg-site-surface mt-16 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <BrandMark site={site} textClassName="tracking-wide uppercase" />
          {brand.tagline && <p className="text-site-muted">{brand.tagline}</p>}
          {contact.socials.length > 0 && (
            <ul className="flex gap-1 pt-1">
              {contact.socials.map((social) => (
                <li key={social.network}>
                  <SocialLink
                    network={social.network}
                    url={social.url}
                    className="border-site-border hover:text-site-primary inline-flex size-11 items-center justify-center rounded-full border"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Pie de página">
          <h2 className="mb-3 text-sm font-semibold tracking-widest uppercase">
            Navegación
          </h2>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="hover:text-site-primary inline-flex min-h-11 items-center"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <address className="space-y-1 not-italic">
          <h2 className="mb-3 text-sm font-semibold tracking-widest uppercase">
            Contacto
          </h2>
          {contact.address && <p>{contact.address}</p>}
          {contact.hours && <p className="text-site-muted">{contact.hours}</p>}
          {tel && (
            <p>
              <a
                href={tel}
                className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              >
                {contact.phone}
              </a>
            </p>
          )}
          {mailtoHref(contact.email) && (
            <p>
              <a
                href={mailtoHref(contact.email) ?? undefined}
                className="inline-flex min-h-11 items-center break-all underline-offset-4 hover:underline"
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
                className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
              >
                <MessageCircle aria-hidden className="size-4" />
                Escribinos por WhatsApp
              </a>
            </p>
          )}
        </address>
      </div>
      <p className="border-site-border text-site-muted border-t px-4 py-4 text-center text-sm">
        © {new Date().getFullYear()} {brand.displayName}. Todos los derechos
        reservados.
      </p>
    </footer>
  )
}
