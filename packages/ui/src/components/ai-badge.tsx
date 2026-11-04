import * as React from "react"
import { cn } from "cn"

import { Badge } from "@adminprop/ui/components/badge"

/**
 * Destello de IA: la estrella de cuatro puntas con el degradé violeta-cobre.
 * Decorativo (`aria-hidden`); el significado lo da el texto que lo acompaña.
 */
function AiSparkle({
  className,
  animated = false,
  ...props
}: Omit<React.ComponentProps<"svg">, "children"> & { animated?: boolean }) {
  const id = React.useId()
  return (
    <svg
      data-slot="ai-sparkle"
      aria-hidden
      viewBox="0 0 24 24"
      className={cn(
        "size-3.5 shrink-0",
        animated && "animate-sparkle",
        className
      )}
      {...props}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--ai-from)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--ai-via)" }} />
          <stop offset="1" style={{ stopColor: "var(--ai-to)" }} />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M12 2C12.8 8 16 11.2 22 12C16 12.8 12.8 16 12 22C11.2 16 8 12.8 2 12C8 11.2 11.2 8 12 2Z"
      />
    </svg>
  )
}

/**
 * Marca lo que generó o sugirió el sistema (tasación automática, borradores,
 * respuestas sugeridas). Nunca es decoración: si lo cargó una persona, no
 * lleva AiBadge.
 */
function AiBadge({
  children = "IA",
  className,
  animated = false,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, "variant"> & {
  animated?: boolean
}) {
  return (
    <Badge
      data-slot="ai-badge"
      variant="ia"
      className={cn("gap-1", className)}
      {...props}
    >
      <AiSparkle animated={animated} />
      {children}
    </Badge>
  )
}

export { AiBadge, AiSparkle }
