"use client"

export default function SiteError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <h1 className="text-3xl font-semibold">Algo salió mal</h1>
      <p className="text-site-muted">
        No pudimos mostrar esta página. Probá de nuevo en un momento.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-site bg-site-primary text-site-on-primary min-h-11 px-6 font-semibold"
      >
        Reintentar
      </button>
    </div>
  )
}
