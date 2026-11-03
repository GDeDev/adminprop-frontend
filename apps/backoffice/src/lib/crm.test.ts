import { describe, expect, it } from "vitest"

import type {
  InquiryCard,
  InquiryStage,
  PipelineDto,
  PropertyListingDto,
} from "@adminprop/shared-types"

import {
  activityText,
  ageLabel,
  applyMove,
  conversionLabel,
  crmErrorMessage,
  isFollowUpDue,
  neighborsAt,
  unattendedCount,
  STAGES,
} from "./crm"
import { listingActions, missingFromError } from "./listings"

function card(id: string, stage: InquiryStage, extra = {}): InquiryCard {
  return {
    id,
    name: id,
    email: null,
    phone: null,
    message: "",
    stage,
    boardPosition: 1,
    source: "PORTAL",
    property: null,
    assignedTo: null,
    nextActionAt: null,
    lastContactAt: null,
    createdAt: "2026-11-01T10:00:00Z",
    ageHours: 2,
    hasWhatsApp: false,
    ...extra,
  }
}

function pipeline(): PipelineDto {
  return {
    columns: STAGES.map((stage) => ({
      stage,
      total: 0,
      cards: [] as InquiryCard[],
    })).map((column) =>
      column.stage === "NEW"
        ? { ...column, total: 2, cards: [card("a", "NEW"), card("b", "NEW")] }
        : column.stage === "CONTACTED"
          ? { ...column, total: 1, cards: [card("c", "CONTACTED")] }
          : column
    ),
  }
}

describe("tablero", () => {
  it("mueve una tarjeta a otra columna en el lugar pedido", () => {
    const result = applyMove(pipeline(), "a", "CONTACTED", 0)
    const col = (s: InquiryStage) => result.columns.find((c) => c.stage === s)!
    expect(col("NEW").cards.map((c) => c.id)).toEqual(["b"])
    expect(col("NEW").total).toBe(1)
    expect(col("CONTACTED").cards.map((c) => c.id)).toEqual(["a", "c"])
    expect(col("CONTACTED").total).toBe(2)
    expect(col("CONTACTED").cards[0]!.stage).toBe("CONTACTED")
  })

  it("reordena dentro de la misma columna sin cambiar el total", () => {
    const result = applyMove(pipeline(), "a", "NEW", 1)
    const column = result.columns.find((c) => c.stage === "NEW")!
    expect(column.cards.map((c) => c.id)).toEqual(["b", "a"])
    expect(column.total).toBe(2)
  })

  it("ignora una tarjeta desconocida", () => {
    const base = pipeline()
    expect(applyMove(base, "zzz", "NEW", 0)).toBe(base)
  })

  it("calcula los vecinos sin contar la tarjeta que se mueve", () => {
    const cards = [card("a", "NEW"), card("b", "NEW"), card("c", "NEW")]
    expect(neighborsAt(cards, "a", 1)).toEqual({
      beforeId: "b",
      afterId: "c",
    })
    expect(neighborsAt(cards, "x", 0)).toEqual({ afterId: "a" })
    expect(neighborsAt(cards, "c", 99)).toEqual({ beforeId: "b" })
    expect(neighborsAt([], "x", 0)).toEqual({})
  })

  it("cuenta las consultas nuevas con más de 24 h", () => {
    const column = {
      stage: "NEW" as const,
      total: 60,
      cards: [card("a", "NEW", { ageHours: 30 }), card("b", "NEW")],
    }
    expect(unattendedCount(column)).toEqual({ count: 1, isLowerBound: true })
    expect(unattendedCount(undefined)).toEqual({
      count: 0,
      isLowerBound: false,
    })
  })
})

describe("textos", () => {
  it("antigüedad", () => {
    expect(ageLabel(0.2)).toBe("Recién")
    expect(ageLabel(5.9)).toBe("Hace 5 h")
    expect(ageLabel(50)).toBe("Hace 2 d")
  })

  it("seguimiento vencido solo en consultas abiertas", () => {
    const today = "2026-11-03"
    expect(
      isFollowUpDue({ nextActionAt: "2026-11-03", stage: "NEW" }, today)
    ).toBe(true)
    expect(
      isFollowUpDue({ nextActionAt: "2026-11-04", stage: "NEW" }, today)
    ).toBe(false)
    expect(
      isFollowUpDue({ nextActionAt: "2026-11-01", stage: "CLOSED_LOST" }, today)
    ).toBe(false)
    expect(isFollowUpDue({ nextActionAt: null, stage: "NEW" }, today)).toBe(
      false
    )
  })

  it("actividades", () => {
    const base = { id: "1", author: null, createdAt: "" }
    expect(
      activityText({
        ...base,
        type: "STAGE_CHANGED",
        payload: { from: "NEW", to: "CONTACTED" },
      })
    ).toBe("Pasó de «Nueva» a «Contactada»")
    expect(
      activityText({ ...base, type: "NOTE", payload: { body: "Llamar" } })
    ).toBe("Llamar")
    expect(
      activityText({
        ...base,
        type: "CONTACT_ATTEMPT",
        payload: { channel: "WHATSAPP" },
      })
    ).toBe("Intento de contacto por WhatsApp")
  })

  it("errores y conversión", () => {
    expect(crmErrorMessage("ASSIGNEE_INVALID")).toMatch(/inactivo/)
    expect(crmErrorMessage("OTRO")).toBeNull()
    expect(conversionLabel("12.5")).toBe("12,5 %")
    expect(conversionLabel(null)).toBe("—")
  })
})

describe("publicaciones", () => {
  const listing = (extra: Partial<PropertyListingDto>): PropertyListingDto => ({
    channel: "MERCADOLIBRE",
    status: "NOT_PUBLISHED",
    externalUrl: null,
    publishedAt: null,
    lastSyncedAt: null,
    lastError: null,
    hasUnpublishedChanges: false,
    canPublish: true,
    missingForPublish: [],
    ...extra,
  })

  it("acciones según el estado", () => {
    expect(listingActions(listing({}))).toEqual(["publish"])
    expect(listingActions(listing({ canPublish: false }))).toEqual([])
    expect(listingActions(listing({ status: "PUBLISHED" }))).toEqual([
      "pause",
      "close",
    ])
    expect(
      listingActions(
        listing({ status: "PUBLISHED", hasUnpublishedChanges: true })
      )
    ).toEqual(["update", "pause", "close"])
    expect(listingActions(listing({ status: "PAUSED" }))).toEqual([
      "resume",
      "close",
    ])
    expect(listingActions(listing({ status: "ERROR" }))).toEqual([
      "retry",
      "close",
    ])
    expect(listingActions(listing({ status: "PUBLISHING" }))).toEqual([])
  })

  it("lee los faltantes del 422", () => {
    expect(
      missingFromError({
        response: { data: { error: { missing: ["fotos", "precio"] } } },
      })
    ).toEqual(["fotos", "precio"])
    expect(missingFromError(new Error("x"))).toEqual([])
  })
})
