"use client"

import { Tag } from "lucide-react"
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic"

import { cn } from "@adminprop/ui/lib/utils"

const KNOWN_ICONS = new Set<string>(iconNames)

/** Ícono de una amenity; uno genérico si no tiene o no existe en lucide. */
export function AmenityIcon({
  name,
  className,
}: {
  name: string | null
  className?: string
}) {
  if (name && KNOWN_ICONS.has(name)) {
    return (
      <DynamicIcon
        name={name as IconName}
        aria-hidden
        className={cn("size-4 text-muted-foreground", className)}
      />
    )
  }
  return (
    <Tag
      aria-hidden
      className={cn("size-4 text-muted-foreground", className)}
    />
  )
}
