"use client"

import { Menu, X } from "lucide-react"
import { useEffect, useId, useState } from "react"

import { cn } from "@/lib/cn"

export interface NavLink {
  href: string
  label: string
}

/** Menú de hamburguesa para mobile: se cierra con Escape y al elegir un link. */
export function MobileMenu({
  links,
  className,
  panelClassName,
}: {
  links: NavLink[]
  className?: string
  panelClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div className={cn("md:hidden", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Cerrar el menú" : "Abrir el menú"}
        onClick={() => setOpen((value) => !value)}
        className="rounded-site inline-flex size-11 items-center justify-center"
      >
        {open ? (
          <X aria-hidden className="size-6" />
        ) : (
          <Menu aria-hidden className="size-6" />
        )}
      </button>
      <nav
        id={panelId}
        aria-label="Menú principal"
        hidden={!open}
        className={cn(
          "border-site-border bg-site-bg absolute inset-x-0 top-full border-b px-4 pb-4 shadow-lg",
          panelClassName
        )}
      >
        <ul className="flex flex-col">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-site-border/60 flex min-h-12 items-center border-b text-lg"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
