import { describe, expect, it } from "vitest"

import type { ImportCounts, ImportEntityCounts } from "@adminprop/shared-types"

import {
  batchPhase,
  batchStatusMeta,
  confirmSummary,
  importableByEntity,
  isBatchRunning,
  jobProgressLabel,
  mastersSummary,
  mastersTotal,
  migrationErrorMessage,
  rowLocation,
  validateExcelFile,
} from "./migration"

const entity = (valid: number): ImportEntityCounts => ({
  total: valid,
  valid,
  errors: 0,
  conflicts: 0,
  imported: 0,
})

const counts: ImportCounts = {
  total: 10,
  valid: 8,
  errors: 1,
  conflicts: 1,
  alreadyImported: 0,
  imported: 0,
  skipped: 0,
  failed: 0,
  needsReview: 0,
  byEntity: {
    OWNER: entity(2),
    RENTER: entity(0),
    GUARANTOR: entity(1),
    PROPERTY: entity(4),
    CONTRACT: entity(1),
  },
}

describe("batchPhase", () => {
  it("elige la pantalla según el estado del lote", () => {
    expect(batchPhase("ANALYZING")).toBe("analyzing")
    expect(batchPhase("READY")).toBe("review")
    expect(batchPhase("IMPORTING")).toBe("importing")
    expect(batchPhase("COMPLETED")).toBe("result")
    expect(batchPhase("PARTIAL")).toBe("result")
    expect(batchPhase("FAILED")).toBe("result")
    expect(batchPhase("DISCARDED")).toBe("discarded")
  })

  it("sólo sigue consultando mientras analiza o importa", () => {
    expect(isBatchRunning("ANALYZING")).toBe(true)
    expect(isBatchRunning("IMPORTING")).toBe(true)
    expect(isBatchRunning("READY")).toBe(false)
    expect(isBatchRunning(undefined)).toBe(false)
  })

  it("marca el parcial como advertencia y el fallido como error", () => {
    expect(batchStatusMeta("PARTIAL").badge).toBe("mantenimiento")
    expect(batchStatusMeta("FAILED").badge).toBe("mora")
  })
})

describe("confirmSummary", () => {
  it("lista en orden de importación, con singular y plural", () => {
    const creatable = importableByEntity(counts)
    expect(confirmSummary(creatable)).toBe(
      "Se crearán 2 propietarios, 1 garante, 4 propiedades y 1 contrato."
    )
  })

  it("descuenta las filas excluidas", () => {
    const creatable = importableByEntity(counts, { PROPERTY: 3, OWNER: 2 })
    expect(creatable).toEqual({ GUARANTOR: 1, PROPERTY: 1, CONTRACT: 1 })
  })

  it("avisa cuando no hay nada para importar", () => {
    expect(confirmSummary({})).toBe("No hay filas para importar.")
  })

  it("con una sola entidad no arma una lista", () => {
    expect(confirmSummary({ PROPERTY: 1 })).toBe("Se creará 1 propiedad.")
  })
})

describe("validateExcelFile", () => {
  it("acepta un .xlsx dentro del límite", () => {
    expect(validateExcelFile({ name: "Datos.XLSX", size: 1024 })).toBeNull()
  })

  it("rechaza otras extensiones, vacíos y archivos de más de 10 MB", () => {
    expect(validateExcelFile({ name: "datos.csv", size: 10 })).toMatch(/xlsx/)
    expect(validateExcelFile({ name: "a.xlsx", size: 0 })).toMatch(/vacío/)
    expect(
      validateExcelFile({ name: "a.xlsx", size: 10 * 1024 * 1024 + 1 })
    ).toMatch(/10 MB/)
  })
})

describe("textos", () => {
  it("traduce los códigos de error propios", () => {
    expect(migrationErrorMessage("TEMPLATE_VERSION_MISMATCH")).toMatch(
      /plantilla actual/
    )
    expect(migrationErrorMessage("OTRO")).toBeNull()
  })

  it("ubica la fila por número de Excel o por id de Tokko", () => {
    expect(rowLocation({ rowNumber: 12, externalId: null })).toBe("Fila 12")
    expect(rowLocation({ rowNumber: null, externalId: "881" })).toBe(
      "Tokko #881"
    )
  })

  it("resume los maestros a crear", () => {
    const masters = { locations: 1, propertyTypes: 2, amenities: 0 }
    expect(mastersTotal(masters)).toBe(3)
    expect(mastersSummary(masters)).toBe("1 ubicación, 2 tipos de propiedad")
  })

  it("describe el avance del trabajo", () => {
    expect(jobProgressLabel(null, null, null)).toBe("Calculando…")
    expect(jobProgressLabel(12, 40, 0)).toBe("12 de 40")
    expect(jobProgressLabel(12, 40, 2)).toBe("12 de 40 · 2 con error")
  })
})
