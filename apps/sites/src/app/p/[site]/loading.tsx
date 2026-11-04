export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-6xl px-4 py-16"
    >
      <p className="sr-only">Cargando…</p>
      <div className="rounded-site bg-site-surface h-8 w-1/3 animate-pulse motion-reduce:animate-none" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="rounded-site bg-site-surface aspect-[4/3] animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  )
}
