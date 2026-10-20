"use client"

import * as React from "react"

import { Button } from "@adminprop/ui/components/button"

/**
 * Scroll infinito (DT-34): al asomarse el final, pide la página siguiente.
 * El botón queda igual, para teclado y lectores de pantalla. Antes vivía
 * copiado en cada listado; desde la Fase 8 es compartido.
 */
export function LoadMore({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
}) {
  const sentinel = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const node = sentinel.current
    if (!node || !hasMore || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !loading) onLoadMore()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  if (!hasMore) return null
  return (
    <div ref={sentinel} className="flex justify-center">
      <Button variant="outline" onClick={onLoadMore} disabled={loading}>
        {loading ? "Cargando…" : "Cargar más"}
      </Button>
    </div>
  )
}
