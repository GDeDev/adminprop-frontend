"use client"

import * as React from "react"
import { cn } from "cn"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

/**
 * Alterna modo claro / oscuro (`next-themes`, clase `.dark` en `<html>`).
 * El ícono sale de CSS (`dark:`), así no hay diferencias entre el HTML del
 * server y el del cliente.
 */
function ThemeToggle({
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "onClick">) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      data-slot="theme-toggle"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring md:size-9 [&_svg]:size-5",
        className
      )}
      {...props}
    >
      <Sun aria-hidden className="dark:hidden" />
      <Moon aria-hidden className="hidden dark:block" />
      <span className="sr-only">Cambiar entre modo claro y oscuro</span>
    </button>
  )
}

export { ThemeToggle }
