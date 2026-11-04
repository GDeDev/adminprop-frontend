import type {
  InquiryCard,
  InquiryStage,
  PipelineDto,
} from "@adminprop/shared-types"

import { STAGES } from "@/lib/crm"

/** Tarjeta de prueba con valores neutros; `extra` pisa lo que importe. */
export function makeCard(
  id: string,
  stage: InquiryStage,
  extra: Partial<InquiryCard> = {}
): InquiryCard {
  return {
    id,
    name: `Cliente ${id}`,
    email: null,
    phone: "1155550000",
    message: "",
    stage,
    boardPosition: 1,
    source: "PORTAL",
    property: null,
    assignedTo: null,
    nextActionAt: null,
    lastContactAt: null,
    createdAt: "2026-11-01T10:00:00Z",
    ageHours: 3,
    hasWhatsApp: true,
    ...extra,
  }
}

/** Pipeline con las seis columnas; `cards` reparte tarjetas por etapa y `totals` pisa el total. */
export function makePipeline(
  cards: Partial<Record<InquiryStage, InquiryCard[]>> = {},
  totals: Partial<Record<InquiryStage, number>> = {}
): PipelineDto {
  return {
    columns: STAGES.map((stage) => ({
      stage,
      total: totals[stage] ?? cards[stage]?.length ?? 0,
      cards: cards[stage] ?? [],
    })),
  }
}
