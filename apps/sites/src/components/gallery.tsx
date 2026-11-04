"use client"

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/cn"

import { SiteImage } from "./site-image"

/** Galería de la ficha: foto grande, flechas, teclado y miniaturas. */
export function Gallery({
  photos,
  title,
  className,
}: {
  photos: { id: string; url: string }[]
  title: string
  className?: string
}) {
  const [index, setIndex] = useState(0)

  const current = photos[index]
  if (!current) {
    return (
      <div
        role="img"
        aria-label={`${title}: sin fotos todavía`}
        className={cn(
          // Una franja baja: sin fotos no hay nada que mostrar y un bloque de
          // 16:9 a todo el ancho (más de 700 px en escritorio) empujaba los datos.
          "bg-site-surface text-site-muted flex h-36 w-full items-center justify-center gap-3 sm:h-44",
          className
        )}
      >
        <ImageOff aria-hidden className="size-6 shrink-0" />
        <span>Esta propiedad todavía no tiene fotos</span>
      </div>
    )
  }

  const go = (next: number) => setIndex((next + photos.length) % photos.length)

  return (
    <div
      className={className}
      role="group"
      aria-roledescription="galería"
      aria-label={`Fotos de ${title}`}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(index + 1)
        if (event.key === "ArrowLeft") go(index - 1)
      }}
    >
      <div className="bg-site-surface relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9]">
        <SiteImage
          key={current.id}
          src={current.url}
          alt={`${title}, foto ${index + 1} de ${photos.length}`}
          priority={index === 0}
          sizes="100vw"
          className="size-full object-cover"
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Foto anterior"
              className="bg-site-bg/85 text-site-text absolute top-1/2 left-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full"
            >
              <ChevronLeft aria-hidden className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Foto siguiente"
              className="bg-site-bg/85 text-site-text absolute top-1/2 right-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full"
            >
              <ChevronRight aria-hidden className="size-6" />
            </button>
            <p
              aria-live="polite"
              className="bg-site-bg/85 absolute right-3 bottom-3 rounded-full px-3 py-1 text-sm"
            >
              {index + 1} / {photos.length}
            </p>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto px-1 pb-2">
          {photos.map((photo, i) => (
            <li key={photo.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver la foto ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "rounded-site block size-16 overflow-hidden border-2 sm:size-20",
                  i === index
                    ? "border-site-text"
                    : "border-transparent opacity-80"
                )}
              >
                <SiteImage
                  src={photo.url}
                  alt=""
                  width={80}
                  height={80}
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
