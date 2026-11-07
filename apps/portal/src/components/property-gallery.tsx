"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"

/** Galería de fotos con scroll horizontal, recorrible con teclado y con botones. */
export function PropertyGallery({
  photos,
  address,
}: {
  photos: { id: string; url: string }[]
  address: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  function scroll(direction: 1 | -1) {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        tabIndex={0}
        role="region"
        aria-label="Fotos de la propiedad"
        className="flex snap-x gap-2 overflow-x-auto rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {photos.map((photo, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.url}
            alt={`Foto ${index + 1} de ${address}`}
            className="h-72 min-w-[85%] snap-center rounded-xl object-cover sm:min-w-[60%]"
          />
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <Button
            type="button"
            variant="secondary"
            aria-label="Anterior"
            onClick={() => scroll(-1)}
            className="absolute top-1/2 left-2 size-11 -translate-y-1/2 rounded-full p-0 shadow-raised"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            aria-label="Siguiente"
            onClick={() => scroll(1)}
            className="absolute top-1/2 right-2 size-11 -translate-y-1/2 rounded-full p-0 shadow-raised"
          >
            <ChevronRight aria-hidden className="size-5" />
          </Button>
        </>
      )}
    </div>
  )
}
