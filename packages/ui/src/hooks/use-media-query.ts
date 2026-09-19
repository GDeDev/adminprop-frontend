"use client"

import * as React from "react"

/**
 * `true` si la media query matchea. En el server (y en el primer render del
 * cliente) devuelve `false`: mobile primero.
 */
export function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    },
    [query]
  )

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}

/** Desde el breakpoint `md` de Tailwind (48rem = 768px). */
export function useIsDesktop() {
  return useMediaQuery("(min-width: 48rem)")
}
