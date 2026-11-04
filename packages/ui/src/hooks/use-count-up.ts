"use client"

import * as React from "react"

import { countUpText } from "@adminprop/ui/lib/count-up"

/**
 * Anima un valor ya formateado de 0 hasta sí mismo (ver `lib/count-up.ts`:
 * solo presentación, termina en el string exacto).
 *
 * - Render del server y primer render del cliente: el valor final (sin
 *   parpadeo, sirve sin JS).
 * - Con `prefers-reduced-motion: reduce` no anima.
 * - Anima con requestAnimationFrame; no toca el layout.
 */
export function useCountUp(
  text: string,
  {
    duration = 900,
    enabled = true,
  }: { duration?: number; enabled?: boolean } = {}
) {
  // `null` = mostrar el valor final tal cual (server, primer render, sin
  // animación). Mientras corre la animación guarda el texto intermedio.
  const [animated, setAnimated] = React.useState<string | null>(null)

  React.useEffect(() => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!enabled || reduced || duration <= 0) return

    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      setAnimated(progress >= 1 ? null : countUpText(text, progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text, duration, enabled])

  return animated ?? text
}
