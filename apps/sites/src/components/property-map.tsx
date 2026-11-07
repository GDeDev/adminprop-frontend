"use client"

import { useState } from "react"
import { ExternalLink, MapPin } from "lucide-react"

import { osmEmbedUrl, osmLink, type Coordinates } from "@/lib/osm"

/**
 * Ubicación en OpenStreetMap. El mapa no se carga hasta que la persona lo pide:
 * así la ficha no hace pedidos a un tercero (ni le cuenta tu IP) por defecto y
 * pesa menos. El link a openstreetmap.org está siempre, también sin JavaScript
 * y para quien no quiere el embed.
 */
export function PropertyMap({
  coordinates,
  title,
}: {
  coordinates: Coordinates
  title: string
}) {
  const [shown, setShown] = useState(false)
  return (
    <div>
      {shown ? (
        <iframe
          title={`Mapa de la ubicación de ${title}`}
          src={osmEmbedUrl(coordinates)}
          loading="lazy"
          referrerPolicy="no-referrer"
          // El mapa necesita scripts y su propio origen; nada más (ni formularios
          // ni navegar la página de arriba).
          sandbox="allow-scripts allow-same-origin"
          className="rounded-site border-site-border aspect-[4/3] w-full border sm:aspect-[16/9]"
        />
      ) : (
        <div className="rounded-site border-site-border bg-site-surface flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 border p-6 text-center sm:aspect-[16/9]">
          <MapPin aria-hidden className="size-8" />
          <p className="text-site-muted max-w-sm text-sm">
            El mapa lo carga OpenStreetMap, un servicio externo. Se muestra solo
            si lo pedís.
          </p>
          <button
            type="button"
            onClick={() => setShown(true)}
            className="rounded-site bg-site-primary text-site-on-primary min-h-11 px-6 font-semibold"
          >
            Ver mapa
          </button>
        </div>
      )}
      <p className="mt-2">
        <a
          href={osmLink(coordinates)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4"
        >
          Abrir en OpenStreetMap
          <ExternalLink aria-hidden className="size-4" />
          <span className="sr-only">(se abre en una pestaña nueva)</span>
        </a>
      </p>
    </div>
  )
}
