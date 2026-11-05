"use client"

import { useEffect, useMemo, useState } from "react"
import { Heart, Share2 } from "lucide-react"

import type { PublicPropertySummary, PublicSite } from "@adminprop/shared-types"

import { favoritesShareText } from "@/lib/favorites"
import { formatPrice, hasPrice } from "@/lib/format"
import { basePath, hrefFor, type SiteRoute } from "@/lib/site-route"
import { whatsappShareLink } from "@/lib/whatsapp"
import { templateKit } from "@/templates"

import { useFavorites } from "./favorites-store"

type Load =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok" }

const BUTTON =
  "rounded-site inline-flex min-h-11 items-center justify-center gap-2 px-5 font-semibold"

/**
 * «Mis favoritos»: lee los ids de `localStorage`, pide las propiedades al propio
 * sitio (`/api/favoritos`) y las dibuja con la tarjeta del template. Quitar un
 * corazón la saca de la lista al instante. Lo que ya no está publicado no
 * vuelve en la respuesta y simplemente no aparece.
 */
export function FavoritesList({
  site,
  route,
}: {
  site: PublicSite
  route: SiteRoute
}) {
  const kit = templateKit(site.template)
  const favorites = useFavorites(route.slug)
  const [load, setLoad] = useState<Load>({ status: "loading" })
  // Solo se vuelve a pedir cuando se agrega un id que no se tiene; quitar uno
  // no necesita red (se filtra de lo ya cargado).
  const [known, setKnown] = useState<Map<string, PublicPropertySummary>>(
    new Map()
  )
  // Ids que la API no devolvió (ya no están publicados): no se vuelven a pedir.
  const [gone, setGone] = useState<Set<string>>(new Set())
  const missing = useMemo(
    () => favorites.ids.filter((id) => !known.has(id) && !gone.has(id)),
    [favorites.ids, known, gone]
  )
  const missingKey = missing.join(",")

  useEffect(() => {
    if (!favorites.ready || !missingKey) return
    const controller = new AbortController()
    fetch(`${basePath(route)}/api/favoritos?ids=${missingKey}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          data?: PublicPropertySummary[]
          message?: string
        }
        if (!response.ok) {
          throw new Error(body.message ?? "No pudimos cargar tus favoritos.")
        }
        setKnown((current) => {
          const next = new Map(current)
          for (const property of body.data ?? []) {
            next.set(property.id.toLowerCase(), property)
          }
          return next
        })
        const returned = new Set(
          (body.data ?? []).map((property) => property.id.toLowerCase())
        )
        setGone(
          (current) =>
            new Set([
              ...current,
              ...missingKey.split(",").filter((id) => !returned.has(id)),
            ])
        )
        setLoad({ status: "ok" })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoad({
          status: "error",
          message:
            error instanceof Error && error.message
              ? error.message
              : "No pudimos cargar tus favoritos. Revisá tu conexión.",
        })
      })
    return () => controller.abort()
  }, [favorites.ready, missingKey, route])

  const items = useMemo(
    () =>
      favorites.ids
        .map((id) => known.get(id))
        .filter((p): p is PublicPropertySummary => Boolean(p)),
    [favorites.ids, known]
  )

  if (
    !favorites.ready ||
    (missingKey !== "" && load.status === "loading" && items.length === 0)
  ) {
    return (
      <p role="status" className="text-site-muted py-10 text-center">
        Cargando tus favoritos…
      </p>
    )
  }

  if (missingKey !== "" && load.status === "error" && items.length === 0) {
    return (
      <div
        role="alert"
        className="rounded-site border-site-border bg-site-surface border p-8 text-center"
      >
        <p className="text-lg font-semibold">No pudimos cargar tus favoritos</p>
        <p className="text-site-muted mt-2">{load.message}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-site border-site-border bg-site-surface border p-8 text-center">
        <Heart aria-hidden className="mx-auto size-10" />
        <p className="mt-3 text-lg font-semibold">
          Todavía no guardaste favoritos
        </p>
        <p className="text-site-muted mt-2">
          Tocá el corazón de una propiedad para guardarla acá y compararla
          después.
        </p>
        <a
          href={hrefFor(route, "/propiedades")}
          className={`${BUTTON} bg-site-primary text-site-on-primary mt-5`}
        >
          Ver propiedades
        </a>
      </div>
    )
  }

  const origin = window.location.origin
  const text = favoritesShareText({
    siteName: site.content.brand.displayName,
    items: items.map((p) => ({
      id: p.id,
      title: p.title,
      price: hasPrice(p.price)
        ? formatPrice(p.price, p.currency)
        : "Precio a consultar",
    })),
    origin,
    basePath: basePath(route),
    ids: items.map((p) => p.id),
  })

  return (
    <>
      {!favorites.persistent && (
        <p
          role="status"
          className="rounded-site border-site-border bg-site-surface mb-6 border p-3 text-sm"
        >
          Tu navegador no nos deja guardar favoritos: la lista dura hasta que
          cierres esta página.
        </p>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-site-muted" aria-live="polite">
          {items.length === 1 ? "1 favorito" : `${items.length} favoritos`}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappShareLink(text)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BUTTON} border-site-primary border-2`}
          >
            <Share2 aria-hidden className="size-5" />
            Compartir por WhatsApp
          </a>
          {site.content.contact.whatsapp && (
            <a
              href={whatsappShareLink(text, site.content.contact.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BUTTON} bg-site-primary text-site-on-primary`}
            >
              Consultar por estas propiedades
            </a>
          )}
        </div>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((property) => (
          <li key={property.id}>
            <kit.PropertyCard site={site} route={route} property={property} />
          </li>
        ))}
      </ul>
    </>
  )
}
