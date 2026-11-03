"use client"

import * as React from "react"

import type { InquiryStage, PipelineDto } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@adminprop/ui/components/tabs"
import { Inbox } from "lucide-react"

import { STAGE_LABELS, stageMeta } from "@/lib/crm"
import { useInfiniteInquiries } from "@/lib/crm-api"
import type { InquiryFilters } from "@/lib/crm-api"

import type { RequestMove } from "./board"
import { InquiryCardView } from "./inquiry-card"

/**
 * Mobile: una pestaña por etapa con su contador, sin arrastre; cada tarjeta
 * tiene el selector «Mover a…» (rediseño, sección 8).
 */
export function StageTabs({
  pipeline,
  filters,
  onOpen,
  onMove,
}: {
  pipeline: PipelineDto
  filters: InquiryFilters
  onOpen: (id: string) => void
  onMove: RequestMove
}) {
  const [stage, setStage] = React.useState<InquiryStage>("NEW")

  return (
    <Tabs
      value={stage}
      onValueChange={(value) => setStage(value as InquiryStage)}
    >
      <TabsList className="h-auto w-full justify-start overflow-x-auto">
        {pipeline.columns.map((column) => (
          <TabsTrigger
            key={column.stage}
            value={column.stage}
            className="gap-2"
          >
            {STAGE_LABELS[column.stage]}
            <Badge variant={stageMeta(column.stage).badge}>
              {column.total}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      {pipeline.columns.map((column) => (
        <TabsContent key={column.stage} value={column.stage}>
          {stage === column.stage && (
            <StageList
              column={column}
              pipeline={pipeline}
              filters={filters}
              onOpen={onOpen}
              onMove={onMove}
            />
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}

function StageList({
  column,
  pipeline,
  filters,
  onOpen,
  onMove,
}: {
  column: PipelineDto["columns"][number]
  pipeline: PipelineDto
  filters: InquiryFilters
  onOpen: (id: string) => void
  onMove: RequestMove
}) {
  const [expanded, setExpanded] = React.useState(false)
  const more = useInfiniteInquiries(
    { ...filters, stage: column.stage },
    expanded
  )
  const known = new Set(column.cards.map((card) => card.id))
  const cards = [
    ...column.cards,
    ...(more.data?.pages.flatMap((page) => page.data) ?? []).filter(
      (card) => !known.has(card.id)
    ),
  ]

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Sin consultas en esta etapa"
        description="Cuando haya, van a aparecer acá."
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {cards.map((card) => (
          <li key={card.id}>
            <InquiryCardView
              card={card}
              onOpen={onOpen}
              onMoveTo={(target) => {
                const destination = pipeline.columns.find(
                  (item) => item.stage === target
                )
                const list = destination?.cards ?? []
                onMove(card, target, list, list.length)
              }}
            />
          </li>
        ))}
      </ul>
      {column.total > cards.length && (!expanded || more.hasNextPage) && (
        <Button
          variant="outline"
          disabled={more.isFetching}
          onClick={() => {
            if (!expanded) setExpanded(true)
            else void more.fetchNextPage()
          }}
        >
          {more.isFetching ? "Cargando…" : "Ver más"}
        </Button>
      )}
    </div>
  )
}
