"use client"

import Link from "next/link"

import { unattendedCount } from "@/lib/crm"
import { usePipeline } from "@/lib/crm-api"

/** Tarjeta «Consultas sin atender»: nuevas con más de 24 h (rediseño Fase 23, sección 8). */
export function UnattendedInquiries() {
  const pipeline = usePipeline({})
  if (pipeline.isPending || pipeline.isError) return null

  const { count, isLowerBound } = unattendedCount(
    pipeline.data.columns.find((column) => column.stage === "NEW")
  )

  return (
    <Link
      href="/crm"
      className="flex max-w-xs lift flex-col gap-1 rounded-xl border bg-card p-4 shadow-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <p className="text-sm text-muted-foreground">Consultas sin atender</p>
      <p
        className={`font-display text-2xl font-semibold tabular-nums ${count > 0 ? "text-destructive" : ""}`}
      >
        {count}
        {isLowerBound && "+"}
      </p>
      <p className="text-xs text-muted-foreground">
        Nuevas hace más de 24 horas
      </p>
    </Link>
  )
}
