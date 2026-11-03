import type { Currency, Money } from "@adminprop/shared-types"
import { cn } from "@adminprop/ui/lib/utils"

import { priceLabel } from "@/lib/public-format"

/**
 * Precio publicado. Sin precio no se muestra un "título" más: es un texto
 * secundario ("Consultar precio") para que no se confunda con el formulario.
 */
export function PriceText({
  price,
  currency,
  className,
}: {
  price: Money | null
  currency: Currency | null
  className?: string
}) {
  const label = priceLabel(price, currency)
  if (label === "Consultar") {
    return <p className="text-sm text-muted-foreground">Consultar precio</p>
  }
  return (
    <p
      className={cn(
        "font-display text-xl font-semibold tabular-nums",
        className
      )}
    >
      {label}
    </p>
  )
}
