import type { PublicSite } from "@adminprop/shared-types"

import { cn } from "@/lib/cn"

import { SiteImage } from "./site-image"

/** Logo de la inmobiliaria (el del sitio o, si falta, el de la cuenta) o su nombre. */
export function BrandMark({
  site,
  className,
  textClassName,
}: {
  site: PublicSite
  className?: string
  textClassName?: string
}) {
  const logo = site.content.brand.logoUrl ?? site.tenant.logoUrl
  const name = site.content.brand.displayName
  return logo ? (
    <SiteImage
      src={logo}
      alt={name}
      height={44}
      priority
      className={cn("h-10 w-auto max-w-[12rem] object-contain", className)}
    />
  ) : (
    <span className={cn("text-xl font-semibold", textClassName)}>{name}</span>
  )
}
