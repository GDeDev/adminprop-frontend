"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // En mobile los toasts suben por encima del BottomNav (4rem) y del
      // área segura del equipo, para no taparlo ni quedar bajo la barra de
      // gestos. Desde md: la esquina inferior derecha, sin barra abajo.
      mobileOffset={{
        bottom: "calc(4rem + env(safe-area-inset-bottom) + 0.75rem)",
        left: "0.75rem",
        right: "0.75rem",
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-info" />,
        warning: <TriangleAlertIcon className="size-4 text-warning" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-lg)",
        } as React.CSSProperties
      }
      // Un error que desaparece en 4 s es fácil de perder (WCAG 2.2.1).
      // Sonner no tiene duración por tipo: se sube para todos y se suma cierre.
      closeButton
      toastOptions={{
        duration: 8000,
        classNames: {
          toast: "shadow-float!",
          // Sonner pinta la descripción con un gris propio que no llega a AA.
          description: "text-muted-foreground!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
