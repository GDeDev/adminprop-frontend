import { describe, expect, it } from "vitest"

import type { NotificationLogItem } from "@adminprop/shared-types"

import { alertIconKind } from "./automations"
import {
  insertVariable,
  notificationStatusMeta,
  notificationTimeline,
  resendProgressLabel,
  toggleChannel,
  unknownVariables,
} from "./notifications"
import { notificationParams } from "./notifications-api"

const item: NotificationLogItem = {
  id: "n1",
  type: "PAYMENT_REMINDER",
  templateKey: "PAYMENT_REMINDER.EMAIL",
  channel: "EMAIL",
  status: "SENT",
  skipReason: null,
  recipientKind: "RENTER",
  recipientLabel: "Ana Pérez",
  recipientEmail: "ana@example.com",
  entityType: "Installment",
  entityId: "i1",
  attempts: 1,
  nextAttemptAt: null,
  lastError: null,
  sentAt: "2026-11-02T10:00:05.000Z",
  deliveredAt: "2026-11-02T10:00:20.000Z",
  openedAt: "2026-11-02T11:00:00.000Z",
  bouncedAt: null,
  createdAt: "2026-11-02T10:00:00.000Z",
}

describe("notificationStatusMeta", () => {
  it("usa los tokens del sistema de diseño", () => {
    expect(notificationStatusMeta(item).badge).toBe("disponible")
    expect(
      notificationStatusMeta({ status: "FAILED", attempts: 4 }).badge
    ).toBe("mora")
    expect(
      notificationStatusMeta({ status: "SKIPPED", attempts: 0 }).badge
    ).toBe("borrador")
  })

  it("distingue en cola de reintentando", () => {
    expect(
      notificationStatusMeta({ status: "QUEUED", attempts: 0 }).label
    ).toBe("En cola")
    expect(
      notificationStatusMeta({ status: "QUEUED", attempts: 2 }).label
    ).toBe("Reintentando")
  })
})

describe("notificationTimeline", () => {
  it("ordena los hitos y omite los que no ocurrieron", () => {
    expect(notificationTimeline(item).map((step) => step.label)).toEqual([
      "Creada",
      "Enviada",
      "Entregada",
      "Abierta",
    ])
  })
})

describe("toggleChannel", () => {
  const available = ["EMAIL", "WHATSAPP_LINK", "IN_APP"] as const
  it("agrega y quita manteniendo el orden", () => {
    expect(toggleChannel(["IN_APP"], [...available], "EMAIL")).toEqual([
      "EMAIL",
      "IN_APP",
    ])
    expect(toggleChannel(["EMAIL", "IN_APP"], [...available], "EMAIL")).toEqual(
      ["IN_APP"]
    )
  })
})

describe("insertVariable", () => {
  it("inserta en el cursor y reemplaza la selección", () => {
    expect(insertVariable("Hola , bien", "recipientName", 5, 5)).toEqual({
      text: "Hola {{recipientName}}, bien",
      cursor: 22,
    })
    expect(insertVariable("Hola XXX", "amount", 5, 8).text).toBe(
      "Hola {{amount}}"
    )
  })
})

describe("unknownVariables", () => {
  it("detecta las que la plantilla no declara, sin repetir", () => {
    expect(
      unknownVariables("{{amount}} {{foo}} {{ foo }} {{bar}}", [
        { name: "amount" },
      ])
    ).toEqual(["foo", "bar"])
  })
})

describe("resendProgressLabel", () => {
  it("muestra avance y errores", () => {
    expect(resendProgressLabel(12, 30, 0)).toBe("12 de 30")
    expect(resendProgressLabel(12, 30, 2)).toBe("12 de 30 · 2 con error")
    expect(resendProgressLabel(5, null, 0)).toBe("5 procesadas")
  })
})

describe("notificationParams", () => {
  it("quita los filtros vacíos", () => {
    expect(
      notificationParams({
        type: "ARREARS_NOTICE",
        status: undefined,
        from: "",
      })
    ).toEqual({ type: "ARREARS_NOTICE" })
  })
})

describe("alertIconKind", () => {
  it("da un ícono propio a los avisos de entrega", () => {
    expect(alertIconKind("JOB_FAILED")).toBe("default")
    expect(alertIconKind("NOTIFICATION_FAILED")).toBe("delivery-failed")
    expect(alertIconKind("EMAIL_BOUNCED")).toBe("email-bounced")
  })
})
