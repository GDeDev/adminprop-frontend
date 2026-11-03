import { describe, expect, it } from "vitest"

import type { AuditEntry } from "@adminprop/shared-types"

import {
  auditActor,
  auditEntityHref,
  auditEntityLabel,
  auditFieldLabel,
  auditValue,
} from "./audit"

const base: AuditEntry = {
  id: "1",
  entity: "Payment",
  entityId: "p1",
  action: "CREATE",
  summary: "Registró un pago",
  actorKind: "USER",
  userId: "u1",
  userEmail: "ana@oppido.com",
  userName: null,
  ip: null,
  createdAt: "2026-11-01T10:00:00Z",
}

describe("auditActor", () => {
  it("usa el nombre y, si no hay, el email", () => {
    expect(auditActor({ ...base, userName: "Ana" })).toBe("Ana")
    expect(auditActor(base)).toBe("ana@oppido.com")
  })

  it("nombra al sistema y a los portales", () => {
    expect(auditActor({ ...base, actorKind: "SYSTEM", userEmail: null })).toBe(
      "Sistema"
    )
    expect(auditActor({ ...base, actorKind: "PORTAL_RENTER" })).toBe(
      "Portal inquilino · ana@oppido.com"
    )
  })
})

describe("auditValue", () => {
  it("prefiere la etiqueta resuelta", () => {
    expect(auditValue("abc", "Calle 1 100")).toBe("Calle 1 100")
  })

  it("formatea vacíos y booleanos", () => {
    expect(auditValue(null)).toBe("—")
    expect(auditValue(true)).toBe("Sí")
    expect(auditValue(12)).toBe("12")
  })
})

describe("etiquetas de auditoría", () => {
  it("traduce entidades y campos, con respaldo legible", () => {
    expect(auditEntityLabel("OwnerStatement")).toBe("Consolidado")
    expect(auditEntityLabel("Algo")).toBe("Algo")
    expect(auditFieldLabel("feePercentage")).toBe("Porcentaje de honorarios")
    expect(auditFieldLabel("someNewField")).toBe("Some new field")
  })

  it("linkea a la ficha cuando existe", () => {
    expect(auditEntityHref("Property", "p1")).toBe("/propiedades/p1")
    expect(auditEntityHref("Payment", "x")).toBeNull()
    expect(auditEntityHref("Property", null)).toBeNull()
  })
})
