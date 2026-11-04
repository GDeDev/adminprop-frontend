"use client"

import * as React from "react"
import { Inbox, Plus } from "lucide-react"

import type { InquiryCard } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { useIsDesktop } from "@adminprop/ui/hooks/use-media-query"

import { usePipeline } from "@/lib/crm-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

import { Board } from "./board"
import { CrmOverview } from "./crm-overview"
import {
  EMPTY_FILTERS,
  InquiryFiltersBar,
  toApiFilters,
} from "./inquiry-filters"
import { InquiryDrawer } from "./inquiry-drawer"
import { useMoveFlow } from "./move-flow"
import { NewInquiryDialog } from "./new-inquiry-dialog"
import { StageTabs } from "./stage-tabs"

/** Embudo de consultas (rediseño de la Fase 23, sección 8). */
export function CrmScreen() {
  const isDesktop = useIsDesktop()
  const [filterState, setFilterState] = React.useState(EMPTY_FILTERS)
  const q = useDebouncedValue(filterState.search.trim())
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const flow = useMoveFlow()

  const filters = React.useMemo(
    () => toApiFilters(filterState, q),
    [filterState, q]
  )
  const pipeline = usePipeline(filters)

  const isEmpty =
    pipeline.data !== undefined &&
    Object.keys(filters).length === 0 &&
    pipeline.data.columns.every((column) => column.total === 0)

  const stageCards = React.useCallback(
    (stage: InquiryCard["stage"]) =>
      pipeline.data?.columns.find((column) => column.stage === stage)?.cards ??
      [],
    [pipeline.data]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Consultas
        </h1>
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden />
          Nueva consulta
        </Button>
      </div>

      <CrmOverview />

      <InquiryFiltersBar value={filterState} onChange={setFilterState} />

      {pipeline.isPending && <PageSkeleton cards={3} />}
      {pipeline.isError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            No se pudieron cargar las consultas.{" "}
            <Button variant="link" onClick={() => void pipeline.refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {pipeline.data && isEmpty && (
        <EmptyState
          icon={Inbox}
          title="Todavía no hay consultas"
          description="Las consultas del portal y de los canales conectados aparecen acá. También podés cargar las que llegan por teléfono o WhatsApp."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              Nueva consulta
            </Button>
          }
        />
      )}
      {pipeline.data &&
        !isEmpty &&
        (isDesktop ? (
          <Board
            pipeline={pipeline.data}
            filters={filters}
            onOpen={setOpenId}
            onMove={flow.request}
          />
        ) : (
          <StageTabs
            pipeline={pipeline.data}
            filters={filters}
            onOpen={setOpenId}
            onMove={flow.request}
          />
        ))}

      <InquiryDrawer
        id={openId}
        onClose={() => setOpenId(null)}
        onMove={flow.request}
        stageCards={stageCards}
      />
      <NewInquiryDialog open={creating} onOpenChange={setCreating} />
      {flow.dialogs}
    </div>
  )
}
