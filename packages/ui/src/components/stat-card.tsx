"use client"

import * as React from "react"
import { cn } from "cn"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { AiBadge } from "@adminprop/ui/components/ai-badge"
import { useCountUp } from "@adminprop/ui/hooks/use-count-up"

type Trend = "up" | "down" | "flat"

const trendStyles: Record<Trend, { icon: LucideIcon; className: string }> = {
  up: { icon: ArrowUpRight, className: "bg-success-soft text-success" },
  down: {
    icon: ArrowDownRight,
    className: "bg-destructive-soft text-destructive",
  },
  flat: { icon: Minus, className: "bg-muted text-muted-foreground" },
}

/**
 * KPI con contador animado (dashboard, resúmenes).
 *
 * `value` es SIEMPRE el string que mandó la API ya formateado: el contador
 * solo lo anima de 0 hasta sí mismo y termina mostrándolo exacto. Este
 * componente no suma, no resta ni redondea (regla "el frontend no calcula
 * montos"). `delta.label` tampoco se calcula acá: viene del backend.
 */
function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  hint,
  ai = false,
  animate = true,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  value: string
  delta?: { label: string; trend: Trend }
  icon?: LucideIcon
  hint?: React.ReactNode
  /** El valor lo estimó el sistema (ej. tasación sugerida): muestra AiBadge. */
  ai?: boolean
  animate?: boolean
}) {
  const shown = useCountUp(value, { enabled: animate })
  const trend = delta ? trendStyles[delta.trend] : null
  const TrendIcon = trend?.icon

  return (
    <div
      data-slot="stat-card"
      className={cn(
        "@container flex lift flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground shadow-raised",
        ai && "ai-border",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-label font-medium text-muted-foreground">
          {label}
        </span>
        {ai ? (
          <AiBadge />
        ) : (
          Icon && (
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Icon aria-hidden className="size-4" />
            </span>
          )
        )}
      </div>
      <p className="font-display num text-title-lg font-semibold whitespace-nowrap @[17rem]:text-display-md">
        {/* Lo que lee un lector de pantalla es el valor final, no el animado. */}
        <span aria-hidden>{shown}</span>
        <span className="sr-only">{value}</span>
      </p>
      {(delta || hint) && (
        <div className="flex items-center gap-2 text-caption text-muted-foreground">
          {delta && trend && TrendIcon && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium",
                trend.className
              )}
            >
              <TrendIcon aria-hidden className="size-3" />
              {delta.label}
            </span>
          )}
          {hint}
        </div>
      )}
    </div>
  )
}

export { StatCard }
