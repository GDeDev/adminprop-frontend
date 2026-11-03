"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { useSession } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"

import { BatchHistory } from "./batch-history"
import { ExcelCard } from "./excel-card"
import { TokkoCard } from "./tokko-card"

/** Configuración → Migración de datos (rediseño Fase 21, sección 7). Sólo administradores. */
export function MigrationScreen() {
  const { user } = useSession()

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        title="Sólo para administradores"
        description="La migración de datos la hacen los administradores."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/configuracion">
            <ChevronLeft aria-hidden />
            Configuración
          </Link>
        </Button>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Migración de datos
        </h1>
        <p className="text-sm text-muted-foreground">
          Traé tus propietarios, inquilinos, propiedades y contratos. Primero se
          analiza y se revisa; recién después, al confirmar, se importa.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ExcelCard />
        <TokkoCard />
      </div>

      <BatchHistory />
    </div>
  )
}
