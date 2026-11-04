"use client"

import * as React from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type {
  InquiryCard,
  InquiryStage,
  PipelineColumn,
  PipelineDto,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"

import { STAGE_LABELS, stageMeta } from "@/lib/crm"
import { useInfiniteInquiries } from "@/lib/crm-api"
import type { InquiryFilters } from "@/lib/crm-api"

import { InquiryCardView } from "./inquiry-card"

export type RequestMove = (
  card: InquiryCard,
  stage: InquiryStage,
  target: InquiryCard[],
  index: number
) => void

/**
 * Alternativa al arrastre («Mover a…»): la tarjeta va al final de la etapa
 * elegida. Es la misma ruta que usa el panel de detalle y la vista mobile.
 */
export function moveToStage(
  pipeline: PipelineDto,
  card: InquiryCard,
  target: InquiryStage,
  onMove: RequestMove
) {
  if (card.stage === target) return
  const list = pipeline.columns.find((item) => item.stage === target)?.cards
  onMove(card, target, list ?? [], (list ?? []).length)
}

const columnId = (stage: InquiryStage) => `column:${stage}`

/** Dónde cayó una tarjeta: etapa destino y lugar dentro de ella (ya sin la tarjeta). */
export function resolveDrop(
  pipeline: PipelineDto,
  activeId: string,
  overId: string
): { stage: InquiryStage; index: number } | null {
  if (overId.startsWith("column:")) {
    const stage = overId.slice("column:".length) as InquiryStage
    const column = pipeline.columns.find((item) => item.stage === stage)
    if (!column) return null
    return {
      stage,
      index: column.cards.filter((card) => card.id !== activeId).length,
    }
  }
  const target = pipeline.columns.find((column) =>
    column.cards.some((card) => card.id === overId)
  )
  if (!target) return null
  const origin = pipeline.columns.find((column) =>
    column.cards.some((card) => card.id === activeId)
  )
  const rest = target.cards.filter((card) => card.id !== activeId)
  const overIndex = rest.findIndex((card) => card.id === overId)
  const movingDown =
    origin?.stage === target.stage &&
    target.cards.findIndex((card) => card.id === activeId) <
      target.cards.findIndex((card) => card.id === overId)
  return { stage: target.stage, index: overIndex + (movingDown ? 1 : 0) }
}

/** Tablero de escritorio: seis columnas con arrastre (mouse, tacto y teclado). */
export function Board({
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Con el dedo, una pausa corta distingue arrastrar de hacer scroll.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const active =
    pipeline.columns
      .flatMap((column) => column.cards)
      .find((card) => card.id === activeId) ?? null

  function handleEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active: dragged, over } = event
    if (!over) return
    const drop = resolveDrop(pipeline, String(dragged.id), String(over.id))
    if (!drop) return
    const card = pipeline.columns
      .flatMap((column) => column.cards)
      .find((item) => item.id === dragged.id)
    const column = pipeline.columns.find((item) => item.stage === drop.stage)
    if (!card || !column) return
    const sameSpot =
      card.stage === drop.stage &&
      column.cards.findIndex((item) => item.id === card.id) === drop.index
    if (sameSpot) return
    onMove(card, drop.stage, column.cards, drop.index)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event: DragStartEvent) =>
        setActiveId(String(event.active.id))
      }
      onDragEnd={handleEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Para mover la consulta, presioná espacio, usá las flechas para elegir el lugar y presioná espacio de nuevo para soltarla. Escape cancela.",
        },
      }}
    >
      <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
        {pipeline.columns.map((column) => (
          <BoardColumn
            key={column.stage}
            column={column}
            filters={filters}
            onOpen={onOpen}
            onMoveTo={(card, target) =>
              moveToStage(pipeline, card, target, onMove)
            }
          />
        ))}
      </div>
      <DragOverlay>
        {active ? (
          <InquiryCardView card={active} onOpen={() => undefined} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function BoardColumn({
  column,
  filters,
  onOpen,
  onMoveTo,
}: {
  column: PipelineColumn
  filters: InquiryFilters
  onOpen: (id: string) => void
  onMoveTo: (card: InquiryCard, target: InquiryStage) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId(column.stage) })
  const [expanded, setExpanded] = React.useState(false)
  const more = useInfiniteInquiries(
    { ...filters, stage: column.stage },
    expanded
  )
  const known = new Set(column.cards.map((card) => card.id))
  const extras =
    more.data?.pages
      .flatMap((page) => page.data)
      .filter((card) => !known.has(card.id)) ?? []
  const hasMore = column.total > column.cards.length

  return (
    <section
      aria-labelledby={`col-${column.stage}`}
      ref={setNodeRef}
      className={`flex min-h-40 flex-col gap-2 rounded-xl border bg-muted/40 p-2 ${isOver ? "ring-2 ring-ring" : ""}`}
    >
      <h3
        id={`col-${column.stage}`}
        className="flex items-center justify-between px-1 text-sm font-medium"
      >
        {STAGE_LABELS[column.stage]}
        <Badge variant={stageMeta(column.stage).badge}>{column.total}</Badge>
      </h3>
      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-2">
          {column.cards.map((card) => (
            <SortableItem
              key={card.id}
              card={card}
              onOpen={onOpen}
              onMoveTo={onMoveTo}
            />
          ))}
          {extras.map((card) => (
            <li key={card.id}>
              <InquiryCardView
                card={card}
                onOpen={onOpen}
                onMoveTo={(target) => onMoveTo(card, target)}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
      {column.total === 0 && (
        <p className="px-1 py-4 text-center text-xs text-muted-foreground">
          Sin consultas
        </p>
      )}
      {hasMore && (!expanded || more.hasNextPage) && (
        <Button
          variant="ghost"
          size="sm"
          disabled={more.isFetching}
          onClick={() => {
            if (!expanded) setExpanded(true)
            else void more.fetchNextPage()
          }}
        >
          {more.isFetching ? "Cargando…" : "Ver más"}
        </Button>
      )}
    </section>
  )
}

function SortableItem({
  card,
  onOpen,
  onMoveTo,
}: {
  card: InquiryCard
  onOpen: (id: string) => void
  onMoveTo: (card: InquiryCard, target: InquiryStage) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-40" : undefined}
    >
      <InquiryCardView
        card={card}
        onOpen={onOpen}
        onMoveTo={(target) => onMoveTo(card, target)}
        dragHandle={{ ...attributes, ...listeners }}
      />
    </li>
  )
}
