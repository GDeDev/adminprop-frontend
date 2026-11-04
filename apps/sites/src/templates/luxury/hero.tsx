import { SearchBar } from "@/components/search-bar"
import { SiteImage } from "@/components/site-image"
import { hrefFor, listingPath } from "@/lib/site-route"
import { whatsappLink } from "@/lib/whatsapp"

import type { SectionProps } from "../types"

/**
 * LUXURY: imagen a pantalla completa con un velo del color del sitio y el
 * título centrado en serif; el buscador va en una barra fina al pie. Sin imagen
 * usa un degradado sobrio del propio tema.
 */
export function LuxuryHero({ site, route, filters }: SectionProps) {
  const { hero, contact } = site.content
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage)

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[80svh] flex-col justify-center overflow-hidden"
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
              "linear-gradient(180deg, var(--site-surface), color-mix(in srgb, var(--site-primary) 14%, var(--site-surface)))",
          }}
        />
      )}
      {/* Velo: asegura el contraste del texto sobre cualquier foto. */}
      <div aria-hidden className="bg-site-bg/70 absolute inset-0 -z-10" />

      <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center">
        <h1
          id="hero-title"
          className="font-site-display text-4xl leading-tight text-balance md:text-6xl"
        >
          {hero.title}
        </h1>
        <span
          aria-hidden
          className="bg-site-primary mx-auto mt-8 block h-px w-20"
        />
        {hero.subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl">
            {hero.subtitle}
          </p>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href={hrefFor(route, "/propiedades")}
            className="bg-site-text text-site-bg rounded-site inline-flex min-h-12 items-center px-8 text-sm font-semibold tracking-[0.18em] uppercase"
          >
            Ver propiedades
          </a>
          {hero.ctaLabel && wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="border-site-text rounded-site inline-flex min-h-12 items-center border px-8 text-sm font-semibold tracking-[0.18em] uppercase"
            >
              {hero.ctaLabel}
            </a>
          )}
        </div>
      </div>

      {hero.showSearch && (
        <div className="mx-auto w-full max-w-6xl px-4 pb-10">
          <SearchBar
            action={listingPath(route)}
            filters={filters}
            preview={route.previewToken}
            layout="bar"
            className="rounded-site border-site-border bg-site-bg border p-4"
          />
        </div>
      )}
    </section>
  )
}
