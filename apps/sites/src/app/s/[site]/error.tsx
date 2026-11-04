"use client"

import { usePathname } from "next/navigation"

/**
 * Pantalla de error de un sitio: la API falló y no hay una versión anterior que
 * mostrar (con ISR, si ya hubo una buena, Next la sigue sirviendo y esto no
 * aparece). Usa las clases `site-*`, así que lleva el tema del sitio cuando el
 * layout pudo cargarlo; si fue el layout el que falló, `app/error.tsx` la
 * muestra con los colores por defecto.
 *
 * `retry` vuelve a pedir los datos al servidor; `reset` solo repintaría el
 * error y no serviría de nada.
 */
export default function SiteError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const pathname = usePathname()
  // En el acceso por slug los links llevan el prefijo `/_s/<slug>`.
  const home = /^\/_s\/[a-z0-9-]+/.exec(pathname)?.[0] ?? "/"

  return (
    <div
      role="alert"
      className="bg-site-bg text-site-text mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center"
    >
      <h1 className="text-3xl font-semibold">Estamos teniendo un problema</h1>
      <p className="text-site-muted">
        No pudimos cargar esta página. No es algo que hayas hecho vos: probá de
        nuevo en un momento.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-site bg-site-primary text-site-on-primary min-h-11 px-6 font-semibold"
        >
          Reintentar
        </button>
        <a
          href={home}
          className="rounded-site border-site-border inline-flex min-h-11 items-center border px-6 font-medium"
        >
          Ir al inicio
        </a>
      </div>
      {error.digest && (
        <p className="text-site-muted text-xs">Referencia: {error.digest}</p>
      )}
    </div>
  )
}
