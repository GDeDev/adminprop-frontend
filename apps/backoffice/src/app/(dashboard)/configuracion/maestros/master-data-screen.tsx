"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { useSession } from "@adminprop/session/client"
import type { CatalogKey } from "@adminprop/shared-types"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@adminprop/ui/components/tabs"

import { CATALOGS } from "@/lib/master-data"

import { CatalogPanel } from "./catalog-panel"
import { LocationTree } from "./location-tree"

const CATALOG_TABS: CatalogKey[] = [
  "property-types",
  "amenities",
  "operation-types",
  "service-types",
]

/**
 * Configuración → Maestros (spec Fase 5, 6): una pestaña por maestro. Los
 * empleados la ven (son los valores que eligen en las altas) pero sólo un
 * admin la edita, igual que en la API.
 */
export function MasterDataScreen() {
  const { user } = useSession()
  const canEdit = user?.role === "ADMIN"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/configuracion"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Configuración
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Maestros
        </h1>
        <p className="text-sm text-muted-foreground">
          Las listas que aparecen en las altas de propiedades, contratos y
          servicios.
          {!canEdit && " Sólo un administrador puede cambiarlas."}
        </p>
      </div>

      <Tabs defaultValue="property-types">
        {/* En mobile las pestañas se desplazan de costado en vez de apretarse. */}
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList>
            {CATALOG_TABS.map((catalog) => (
              <TabsTrigger key={catalog} value={catalog}>
                {CATALOGS[catalog].title}
              </TabsTrigger>
            ))}
            <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          </TabsList>
        </div>
        {CATALOG_TABS.map((catalog) => (
          <TabsContent key={catalog} value={catalog} className="pt-4">
            <CatalogPanel catalog={catalog} canEdit={canEdit} />
          </TabsContent>
        ))}
        <TabsContent value="locations" className="pt-4">
          <LocationTree canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
