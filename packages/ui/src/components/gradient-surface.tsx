import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const gradientSurfaceVariants = cva(
  "relative isolate overflow-hidden rounded-xl p-6",
  {
    variants: {
      variant: {
        /** Héroe de marca: el primary del tenant con luz arriba. */
        brand:
          "bg-primary-gradient text-primary-foreground shadow-float before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-dots before:opacity-20 before:content-['']",
        /** Superficie de IA: tarjeta con borde degradé. */
        ai: "bg-card text-card-foreground shadow-raised ai-border",
        /** Atmósfera suave para héroes, login y vacíos. */
        mesh: "border bg-mesh text-foreground",
      },
    },
    defaultVariants: { variant: "mesh" },
  }
)

/**
 * Superficie con degradé. Un contenedor, no un control: el contenido lo pone
 * quien lo usa. Los colores salen de `--primary`, `--accent` y `--ai`, así que
 * siguen el tema de la inmobiliaria. No se usa en filas de listas ni de
 * tablas (ver reglas de movimiento y blur en ADMINPROP-UI-v2.md).
 */
function GradientSurface({
  className,
  variant = "mesh",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof gradientSurfaceVariants>) {
  return (
    <div
      data-slot="gradient-surface"
      data-variant={variant}
      className={cn(gradientSurfaceVariants({ variant }), className)}
      {...props}
    />
  )
}

export { GradientSurface, gradientSurfaceVariants }
