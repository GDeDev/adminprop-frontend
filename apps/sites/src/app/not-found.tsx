export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-site-muted text-sm font-semibold tracking-widest uppercase">
        Error 404
      </p>
      <h1 className="text-3xl font-semibold">No encontramos este sitio</h1>
      <p className="text-site-muted">
        Puede que la dirección esté mal escrita o que el sitio todavía no esté
        publicado. Revisá el link e intentá de nuevo.
      </p>
    </main>
  )
}
