"use client"

import * as React from "react"

interface Props {
  /** URL firmada tal como llegó con el recurso (vence a los 10 minutos). */
  src: string
  alt: string
  className?: string
  /** Vuelve a pedir el recurso y devuelve la URL nueva de esta imagen. */
  refresh: () => Promise<string | null | undefined>
}

/**
 * Imagen de un archivo privado (URL firmada, ver `PrivateFileLink`). Si la
 * carga falla, lo más probable es que la URL haya vencido (la pantalla quedó
 * abierta, o la query vino de la caché): pide el recurso una vez y reintenta
 * con la URL fresca. Si vuelve a fallar no insiste.
 */
export function PrivateImage({ src, alt, className, refresh }: Props) {
  // URL fresca para el `src` actual. Si llega otro `src` (se refrescó la
  // query), se usa ese y esto queda descartado.
  const [fresh, setFresh] = React.useState<{ for: string; url: string } | null>(
    null
  )
  const retriedFor = React.useRef<string | null>(null)
  const current = fresh?.for === src ? fresh.url : src

  async function handleError() {
    if (retriedFor.current === src) return
    retriedFor.current = src
    try {
      const url = await refresh()
      if (url && url !== src) setFresh({ for: src, url })
    } catch {
      // Sin red o sin permiso: queda la imagen rota, como cualquier otra.
    }
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => void handleError()}
    />
  )
}
