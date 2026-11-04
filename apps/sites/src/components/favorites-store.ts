"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"

import {
  favoritesKey,
  parseFavorites,
  serializeFavorites,
  toggleFavorite,
} from "@/lib/favorites"

/**
 * Store de favoritos del navegador. `localStorage` puede no existir o lanzar
 * (modo privado, sitio bloqueado, cuota llena): en ese caso la lista vive en
 * memoria mientras la pestaña esté abierta y `persistent` avisa que no se va a
 * recordar. Todos los botones de la página comparten el mismo estado.
 */

const EVENT = "adminprop-sites:favorites"

/** Copia en memoria: respaldo cuando no se puede guardar, y caché del snapshot. */
const memory = new Map<string, string>()
const unsaved = new Set<string>()

function readStorage(slug: string): string | null {
  try {
    return window.localStorage.getItem(favoritesKey(slug))
  } catch {
    return null
  }
}

function snapshot(slug: string): string {
  // Si ya falló un guardado, manda la memoria; si no, lo que haya en storage.
  if (unsaved.has(slug)) return memory.get(slug) ?? "[]"
  const raw = readStorage(slug)
  // Se re-serializa lo parseado: lo roto o manipulado se ve como lista vacía o
  // limpia, y el string es estable entre lecturas (useSyncExternalStore lo exige).
  return serializeFavorites(parseFavorites(raw))
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

function write(slug: string, ids: string[]): void {
  const raw = serializeFavorites(ids)
  memory.set(slug, raw)
  try {
    window.localStorage.setItem(favoritesKey(slug), raw)
    unsaved.delete(slug)
  } catch {
    unsaved.add(slug)
  }
  window.dispatchEvent(new Event(EVENT))
}

export interface Favorites {
  ids: string[]
  has: (id: string) => boolean
  /** Devuelve `full: true` si la lista está llena y no se pudo agregar. */
  toggle: (id: string) => { full: boolean }
  /** `false` si el navegador no dejó guardar: la lista dura solo esta visita. */
  persistent: boolean
  /** `false` hasta que el navegador leyó el storage (en el servidor y al hidratar). */
  ready: boolean
}

export function useFavorites(slug: string): Favorites {
  // En el servidor y en la hidratación: lista vacía (el HTML coincide). Después
  // del montaje, lo guardado.
  const raw = useSyncExternalStore(
    subscribe,
    () => snapshot(slug),
    () => "[]"
  )
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  const ids = useMemo(() => parseFavorites(raw), [raw])
  const toggle = useCallback(
    (id: string) => {
      const result = toggleFavorite(parseFavorites(snapshot(slug)), id)
      if (!result.full) write(slug, result.ids)
      return { full: result.full }
    },
    [slug]
  )
  return {
    ids,
    has: (id) => ids.includes(id.toLowerCase()),
    toggle,
    persistent: !unsaved.has(slug),
    ready,
  }
}
