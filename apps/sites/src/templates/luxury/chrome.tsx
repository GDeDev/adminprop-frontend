import { MessageCircle } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { SocialLink } from "@/components/icons"
import { MobileMenu } from "@/components/mobile-menu"
import { mailtoHref } from "@/lib/safe-links"
import { navLinks } from "@/lib/site-links"
import { hrefFor } from "@/lib/site-route"
import { telLink, whatsappLink } from "@/lib/whatsapp"

import type { SiteProps } from "../types"

const NAV_LINK =
  "inline-flex min-h-11 items-center px-3 text-sm tracking-[0.18em] uppercase hover:underline hover:underline-offset-8"

/** LUXURY: marca centrada arriba y el menú en una línea fina debajo. */
export function LuxuryHeader({ site, route }: SiteProps) {
  const links = navLinks(site, route)
  return (
    <header className="border-site-border bg-site-bg/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:flex-col md:py-5">
        <a
          href={hrefFor(route, "/")}
          aria-label={`${site.content.brand.displayName}, ir al inicio`}
          className="font-site-display flex min-h-11 items-center"
        >
          <BrandMark
            site={site}
            textClassName="font-site-display text-2xl tracking-[0.12em] uppercase md:text-3xl"
          />
        </a>
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center justify-center gap-4">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={NAV_LINK}>
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

export function LuxuryFooter({ site, route }: SiteProps) {
  const { contact, brand } = site.content
  const links = navLinks(site, route)
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage)
  const tel = telLink(contact.phone)
  const mail = mailtoHref(contact.email)

  return (
    <footer className="border-site-border mt-24 border-t">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <BrandMark
          site={site}
          textClassName="font-site-display text-3xl tracking-[0.12em] uppercase"
        />
        {brand.tagline && (
          <p className="text-site-muted mx-auto mt-4 max-w-md">
            {brand.tagline}
          </p>
        )}
        <nav aria-label="Pie de página" className="mt-8">
          <ul className="flex flex-wrap justify-center gap-x-2">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={NAV_LINK}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <address className="mt-8 space-y-1 not-italic">
          {contact.address && <p>{contact.address}</p>}
          {contact.hours && <p className="text-site-muted">{contact.hours}</p>}
          <p className="flex flex-wrap items-center justify-center gap-x-6">
            {tel && (
              <a
                href={tel}
                className="inline-flex min-h-11 items-center hover:underline"
              >
                {contact.phone}
              </a>
            )}
            {mail && (
              <a
                href={mail}
                className="inline-flex min-h-11 items-center break-all hover:underline"
              >
                {contact.email}
              </a>
            )}
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 hover:underline"
              >
                <MessageCircle aria-hidden className="size-4" />
                WhatsApp
              </a>
            )}
          </p>
        </address>
        {contact.socials.length > 0 && (
          <ul className="mt-4 flex justify-center gap-2">
            {contact.socials.map((social) => (
              <li key={social.network}>
                <SocialLink
                  network={social.network}
                  url={social.url}
                  className="border-site-border hover:bg-site-text hover:text-site-bg inline-flex size-11 items-center justify-center rounded-full border"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-site-muted border-site-border border-t px-4 py-6 text-center text-xs tracking-[0.2em] uppercase">
        © {new Date().getFullYear()} {brand.displayName}
      </p>
    </footer>
  )
}
