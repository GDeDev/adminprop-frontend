"use client"

import Link from "next/link"
import {
  ChevronRight,
  Bell,
  DatabaseZap,
  Megaphone,
  Building2,
  History,
  ListTree,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react"
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
      className="flex lift items-center gap-4 rounded-xl border bg-card p-4 shadow-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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

/** Secciones de configuración. Usuarios e Índices solo las ven los administradores. */
export function SettingsIndex() {
  const { user } = useSession()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-title-lg font-semibold md:text-display-md">
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
          <>
            <li>
              <SettingsLink
                href="/configuracion/inmobiliaria"
                icon={Building2}
                title="Inmobiliaria"
                description="Razón social, CUIT, datos bancarios, logo y color que salen en los PDF."
              />
            </li>
            <li>
              <SettingsLink
                href="/configuracion/usuarios"
                icon={Users}
                title="Usuarios"
                description="Administradores y empleados, roles y accesos."
              />
            </li>
            <li>
              <SettingsLink
                href="/configuracion/automatizaciones"
                icon={Timer}
                title="Automatizaciones"
                description="Cuotas, aumentos, índices y avisos que corren solos; historial y ejecución manual."
              />
            </li>
            <li>
              <SettingsLink
                href="/configuracion/notificaciones"
                icon={Bell}
                title="Notificaciones"
                description="Avisos por email y WhatsApp: eventos, plantillas, historial de envíos."
              />
            </li>
            <li>
              <SettingsLink
                href="/configuracion/canales"
                icon={Megaphone}
                title="Canales de publicación"
                description="Conectá Mercado Libre para publicar propiedades y recibir consultas."
              />
            </li>
            <li>
              <SettingsLink
                href="/configuracion/auditoria"
                icon={History}
                title="Auditoría"
                description="Quién hizo qué y cuándo: altas, cambios, ingresos y envíos."
              />
            </li>
            <li>
              <SettingsLink
                href="/configuracion/migracion"
                icon={DatabaseZap}
                title="Migración de datos"
                description="Importá propietarios, inquilinos, propiedades y contratos desde Excel o Tokko."
              />
            </li>
            <li>
              <SettingsLink
                href="/configuracion/indices"
                icon={TrendingUp}
                title="Índices"
                description="Valores mensuales de ICL e IPC para los aumentos de alquiler."
              />
            </li>
          </>
        )}
      </ul>
    </div>
  )
}
