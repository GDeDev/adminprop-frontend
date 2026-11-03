"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/cn"

/**
 * Aparición suave al entrar en pantalla. Sin JavaScript (o sin
 * IntersectionObserver) el contenido se ve igual: el estado inicial lo decide
 * `data-visible`, y con `prefers-reduced-motion` el CSS no anima nada.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px 15% 0px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-visible={visible}
      className={cn("reveal", className)}
      // Sin JS el HTML del servidor ya trae `reveal` oculto: el <noscript> del
      // layout lo deja visible.
    >
      {children}
    </div>
  )
}
