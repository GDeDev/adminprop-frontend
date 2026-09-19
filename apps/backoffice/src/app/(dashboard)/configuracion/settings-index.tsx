"use client"

import Link from "next/link"
import { ChevronRight, ListTree, SlidersHorizontal, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { useSession } from "@adminprop/session/client"

function SettingsLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Icon aria-hidden className="size-5 text-primary" />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
    </Link>
  )
}

/** Secciones de configuración. Usuarios sólo la ven los administradores. */
export function SettingsIndex() {
  const { user } = useSession()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Configuración
      </h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        <li>
          <SettingsLink
            href="/configuracion/maestros"
            icon={ListTree}
            title="Maestros"
            description="Tipos de propiedad, amenities, operaciones, servicios y ubicaciones."
          />
        </li>
        {user?.role === "ADMIN" && (
          <li>
            <SettingsLink
              href="/configuracion/usuarios"
              icon={Users}
              title="Usuarios"
              description="Administradores y empleados, roles y accesos."
            />
          </li>
        )}
        <li className="flex items-center gap-4 rounded-xl border border-dashed p-4 text-muted-foreground">
          <SlidersHorizontal aria-hidden className="size-5" />
          <div>
            <p className="font-medium">Parámetros de la inmobiliaria</p>
            <p className="text-sm">
              Honorarios, punitorios y días de corte. Más adelante.
            </p>
          </div>
        </li>
      </ul>
    </div>
  )
}
