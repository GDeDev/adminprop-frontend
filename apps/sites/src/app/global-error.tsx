"use client"

import "./globals.css"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body>
        <main
          role="alert"
          className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center"
        >
          <h1 className="text-3xl font-semibold">Algo salió mal</h1>
          <p className="text-site-muted">
            No pudimos mostrar la página. Probá de nuevo en un momento.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-site bg-site-primary text-site-on-primary min-h-11 px-6 font-semibold"
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  )
}
