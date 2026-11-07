"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Inbox, Plus, Search } from "lucide-react"

import type { InquiryCard, InquirySource } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Input } from "@adminprop/ui/components/input"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import { useIsDesktop } from "@adminprop/ui/hooks/use-media-query"

import { PropertySelect } from "@/components/property-select"
import { SOURCE_LABELS } from "@/lib/crm"
import { useAssignees, usePipeline } from "@/lib/crm-api"
import type { InquiryFilters } from "@/lib/crm-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

import { CrmOverview } from "./crm-overview"
import { InquiryDrawer } from "./inquiry-drawer"
import { useMoveFlow } from "./move-flow"
import { NewInquiryDialog } from "./new-inquiry-dialog"
import { StageTabs } from "./stage-tabs"

// El tablero arrastrable (@dnd-kit) solo se usa en escritorio: va en su propio
// chunk y se carga recién cuando se monta, así el celular (pestañas) no lo baja.
const Board = dynamic(() => import("./board").then((m) => m.Board), {
  ssr: false,
  loading: () => <PageSkeleton cards={3} />,
})

const ALL = "all"
const UNASSIGNED = "unassigned"

/** Embudo de consultas (rediseño de la Fase 23, sección 8). */
export function CrmScreen() {
  const isDesktop = useIsDesktop()
  const assignees = useAssignees()
  const [assignee, setAssignee] = React.useState(ALL)
  const [source, setSource] = React.useState<InquirySource | typeof ALL>(ALL)
  const [propertyId, setPropertyId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const q = useDebouncedValue(search.trim())
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const flow = useMoveFlow()

  const filters = React.useMemo<InquiryFilters>(
    () => ({
      ...(assignee === UNASSIGNED ? { unassigned: true } : {}),
      ...(assignee !== ALL && assignee !== UNASSIGNED
        ? { assignedToId: assignee }
        : {}),
      ...(source !== ALL ? { source } : {}),
      ...(propertyId ? { propertyId } : {}),
      ...(q ? { q } : {}),
    }),
    [assignee, source, propertyId, q]
  )
  const pipeline = usePipeline(filters)
  // Sin filtros y sin ninguna consulta en ninguna etapa: en vez de un tablero
  // vacío, el estado vacío con el alta manual.
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
        <h1 className="font-display text-title-lg font-semibold md:text-display-md">
          Consultas
        </h1>
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden />
          Nueva consulta
        </Button>
      </div>

      <CrmOverview />

      <div
        role="search"
        aria-label="Filtros de consultas"
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Buscar consultas"
            placeholder="Buscar por nombre, email o teléfono"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger aria-label="Asignado a" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los asignados</SelectItem>
            <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
            {assignees.data?.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={source}
          onValueChange={(value) => setSource(value as InquirySource | "all")}
        >
          <SelectTrigger aria-label="Canal" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los canales</SelectItem>
            {(Object.keys(SOURCE_LABELS) as InquirySource[]).map((item) => (
              <SelectItem key={item} value={item}>
                {SOURCE_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PropertySelect
          value={propertyId}
          onChange={(value) => setPropertyId(value)}
          aria-label="Propiedad"
        />
      </div>

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
      {isEmpty && (
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
