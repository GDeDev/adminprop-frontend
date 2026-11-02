"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { useSession } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@adminprop/ui/components/tabs"

import { HistoryTab } from "./history-tab"
import { SettingsTab } from "./settings-tab"
import { TemplatesTab } from "./templates-tab"
import { WhatsAppTab } from "./whatsapp-tab"

/** Configuración → Notificaciones (rediseño Fase 14, sección 7). Sólo administradores. */
export function NotificationsScreen() {
  const { user } = useSession()

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        title="Sólo para administradores"
        description="Las notificaciones las configuran los administradores."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/configuracion">
            <ChevronLeft aria-hidden />
            Configuración
          </Link>
        </Button>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Notificaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Qué avisos salen, por qué canal, con qué texto, y si llegaron.
        </p>
      </div>

      <Tabs defaultValue="events">
        {/* En mobile las pestañas se desplazan de costado en vez de apretarse. */}
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList>
            <TabsTrigger value="events">Eventos y canales</TabsTrigger>
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="events" className="pt-4">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="templates" className="pt-4">
          <TemplatesTab />
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <HistoryTab />
        </TabsContent>
        <TabsContent value="whatsapp" className="pt-4">
          <WhatsAppTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
