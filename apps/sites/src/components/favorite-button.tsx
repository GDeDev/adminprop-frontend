"use client"

import { useState } from "react"
import { Heart } from "lucide-react"

import { cn } from "@/lib/cn"

import { useFavorites } from "./favorites-store"

/**
 * Corazón para guardar una propiedad en los favoritos del navegador. Es un
 * botón con `aria-pressed` (no un link) y un área táctil de 44 px.
 */
export function FavoriteButton({
  slug,
  propertyId,
  title,
  className,
}: {
  slug: string
  propertyId: string
  title: string
  className?: string
}) {
  const favorites = useFavorites(slug)
  const [notice, setNotice] = useState<string | null>(null)
  const active = favorites.has(propertyId)

  function onClick() {
    const { full } = favorites.toggle(propertyId)
    setNotice(
      full
        ? "Llegaste al máximo de favoritos. Quitá alguno para guardar otro."
        : null
    )
  }

  return (
    <>
      <button
        type="button"
        aria-pressed={active}
        aria-label={
          active
            ? `Quitar ${title} de favoritos`
            : `Guardar ${title} en favoritos`
        }
        onClick={onClick}
        className={cn(
          "bg-site-bg text-site-text inline-flex size-11 items-center justify-center rounded-full shadow-sm",
          className
        )}
      >
        <Heart aria-hidden className={cn("size-5", active && "fill-current")} />
      </button>
      {/* Se ve y además se anuncia (role=status) sin mover el foco. */}
      <span
        role="status"
        className={
          notice
            ? "bg-site-bg text-site-text border-site-border absolute top-14 right-3 z-20 w-48 rounded-md border p-2 text-xs shadow"
            : "sr-only"
        }
      >
        {notice}
      </span>
    </>
  )
}
