"use client"

import Link from "next/link"
import { ChevronRight, SlidersHorizontal, Users } from "lucide-react"

import { useSession } from "@adminprop/session/client"

/** Secciones de configuración. Usuarios sólo la ven los administradores. */
export function SettingsIndex() {
  const { user } = useSession()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Configuración
      </h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {user?.role === "ADMIN" && (
          <li>
            <Link
              href="/configuracion/usuarios"
              className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Users aria-hidden className="size-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Usuarios</p>
                <p className="text-sm text-muted-foreground">
                  Administradores y empleados, roles y accesos.
                </p>
              </div>
              <ChevronRight
                aria-hidden
                className="size-4 text-muted-foreground"
              />
            </Link>
          </li>
        )}
        <li className="flex items-center gap-4 rounded-xl border border-dashed p-4 text-muted-foreground">
          <SlidersHorizontal aria-hidden className="size-5" />
          <div>
            <p className="font-medium">Parámetros y maestros</p>
            <p className="text-sm">Llega en la Fase 5.</p>
          </div>
        </li>
      </ul>
    </div>
  )
}
