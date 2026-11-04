import { ArrowRight, MessageCircle } from "lucide-react"

import { SearchBar } from "@/components/search-bar"
import { SiteImage } from "@/components/site-image"
import { hrefFor, listingPath } from "@/lib/site-route"
import { whatsappLink } from "@/lib/whatsapp"

import type { SectionProps } from "../types"

/**
 * MODERN: titular grande a la izquierda, imagen (o bloque de color) a la
 * derecha y una barra de búsqueda horizontal que se monta sobre el borde.
 */
export function ModernHero({ site, route, filters }: SectionProps) {
  const { hero, contact } = site.content
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage)

  return (
    <section aria-labelledby="hero-title" className="pt-10 md:pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1
            id="hero-title"
            className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {hero.title}
          </h1>
          {hero.subtitle && (
            <p className="text-site-muted mt-5 max-w-xl text-lg md:text-xl">
              {hero.subtitle}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={hrefFor(route, "/propiedades")}
              className="bg-site-primary text-site-on-primary inline-flex min-h-12 items-center gap-2 rounded-full px-7 font-semibold"
            >
              Ver propiedades
              <ArrowRight aria-hidden className="size-4" />
            </a>
            {hero.ctaLabel && wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="border-site-border hover:bg-site-surface inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-6 font-semibold"
              >
                <MessageCircle aria-hidden className="size-5" />
                {hero.ctaLabel}
              </a>
            )}
          </div>
        </div>
        <div className="rounded-site relative aspect-[4/3] overflow-hidden lg:aspect-[5/4]">
          {hero.backgroundImageUrl ? (
            <SiteImage
              src={hero.backgroundImageUrl}
              alt=""
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="size-full object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="size-full"
              style={{
                background:
                  "radial-gradient(70% 70% at 80% 20%, color-mix(in srgb, var(--site-primary) 45%, var(--site-surface)) 0%, transparent 70%), linear-gradient(160deg, var(--site-surface), color-mix(in srgb, var(--site-primary) 18%, var(--site-surface)))",
              }}
            />
          )}
        </div>
      </div>
      {hero.showSearch && (
        <div className="mx-auto mt-10 max-w-6xl px-4 lg:-mb-8">
          <SearchBar
            action={listingPath(route)}
            filters={filters}
            preview={route.previewToken}
            layout="bar"
            className="rounded-site border-site-border bg-site-bg relative border p-4 shadow-xl"
          />
        </div>
      )}
    </section>
  )
}
