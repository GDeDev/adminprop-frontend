import { cn } from "@/lib/cn"

/**
 * Aparición suave al entrar en pantalla, solo con CSS (`animation-timeline:
 * view()`): cero JavaScript, y en navegadores sin soporte o con
 * `prefers-reduced-motion` el contenido se ve de entrada.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("reveal", className)}>{children}</div>
}
