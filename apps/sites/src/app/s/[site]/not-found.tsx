"use client"

import { usePathname } from "next/navigation"

/** 404 dentro de un sitio (propiedad que ya no está, página que no existe). */
export default function SiteNotFound() {
  const pathname = usePathname()
  // En el acceso por slug los links llevan el prefijo `/_s/<slug>`.
  const home = /^\/_s\/[a-z0-9-]+/.exec(pathname)?.[0] ?? "/"

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-site-muted text-sm font-semibold tracking-widest uppercase">
        Error 404
      </p>
      <h1 className="text-3xl font-semibold">No encontramos esta página</h1>
      <p className="text-site-muted">
        Puede que la propiedad ya no esté disponible o que el link esté mal
        escrito.
      </p>
      <a
        href={home}
        className="rounded-site bg-site-primary text-site-on-primary inline-flex min-h-11 items-center px-6 font-semibold"
      >
        Volver al inicio
      </a>
    </div>
  )
}
