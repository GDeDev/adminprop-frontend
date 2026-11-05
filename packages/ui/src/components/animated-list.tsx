import * as React from "react"
import { cn } from "cn"

/**
 * Lista cuyos hijos entran de a uno (fade + subida de 8px, 40ms de
 * diferencia, tope en el octavo). Es CSS puro (`.stagger`): sin JS, anima solo
 * transform y opacity y se apaga con prefers-reduced-motion.
 *
 * Solo para la primera carga de una lista corta (≤ 12 ítems). En listas
 * largas o paginadas no se usa: cada página nueva volvería a animar.
 */
function AnimatedList({
  as = "ul",
  className,
  ...props
}: React.ComponentProps<"ul"> & { as?: "ul" | "ol" | "div" }) {
  return React.createElement(as, {
    "data-slot": "animated-list",
    className: cn("stagger", className),
    ...props,
  })
}

function AnimatedListItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li data-slot="animated-list-item" className={cn(className)} {...props} />
  )
}

export { AnimatedList, AnimatedListItem }
