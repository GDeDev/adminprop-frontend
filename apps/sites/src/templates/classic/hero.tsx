import { MessageCircle } from "lucide-react"

import { SearchBar } from "@/components/search-bar"
import { SiteImage } from "@/components/site-image"
import { listingPath } from "@/lib/site-route"
import { whatsappLink } from "@/lib/whatsapp"

import type { SectionProps } from "../types"

/**
 * CLASSIC: hero a pantalla completa con imagen de fondo y, sobre ella, una
 * tarjeta translúcida con el título, el CTA y el buscador. Sin imagen carga un
 * degradado del propio tema.
 */
export function ClassicHero({ site, route, filters }: SectionProps) {
  const { hero, contact } = site.content
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage)

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[85svh] items-center overflow-hidden"
    >
      {hero.backgroundImageUrl ? (
        <SiteImage
          src={hero.backgroundImageUrl}
          alt=""
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 size-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            background:
              "radial-gradient(120% 90% at 20% 10%, color-mix(in srgb, var(--site-primary) 28%, var(--site-background)) 0%, var(--site-background) 60%), linear-gradient(135deg, var(--site-surface), var(--site-background))",
          }}
        />
      )}
      <div aria-hidden className="bg-site-bg/45 absolute inset-0 -z-10" />

      <div className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="rounded-site border-site-border bg-site-bg/80 border p-6 shadow-2xl backdrop-blur-md md:p-12">
          <h1
            id="hero-title"
            className="text-4xl leading-tight font-semibold md:text-5xl"
          >
            {hero.title}
          </h1>
          {hero.subtitle && (
            <p className="text-site-muted mt-4 max-w-2xl text-lg md:text-xl">
              {hero.subtitle}
            </p>
          )}
          {hero.ctaLabel && wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-site-primary text-site-on-primary mt-6 inline-flex min-h-12 items-center gap-2 rounded-full px-7 font-semibold"
            >
              <MessageCircle aria-hidden className="size-5" />
              {hero.ctaLabel}
            </a>
          )}
          {hero.showSearch && (
            <SearchBar
              action={listingPath(route)}
              filters={filters}
              preview={route.previewToken}
              className="rounded-site border-site-border bg-site-bg mt-8 border p-4"
            />
          )}
        </div>
      </div>
    </section>
  )
}
