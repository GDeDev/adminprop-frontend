import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  ImportBatchDetail,
  ImportCounts,
  ImportRowDto,
} from "@adminprop/shared-types"

import { ExcelCard } from "./excel-card"
import { ProgressPanel } from "./progress-panel"
import { ReviewStep } from "./review-step"
import { RowCard } from "./rows-list"
import { parseLimit } from "./tokko-card"

const push = vi.fn()
const replace = vi.fn()
const analyze = vi.fn()
const confirm = vi.fn()
let jobStatus: unknown = undefined

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

vi.mock("@/lib/jobs-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/jobs-api")>()),
  useJobStatus: () => ({ data: jobStatus, isError: false }),
}))

vi.mock("@/lib/migration-api", () => ({
  downloadExcelTemplate: vi.fn(),
  downloadBatchReport: vi.fn(),
  useAnalyzeExcel: () => ({
    mutateAsync: analyze,
    isPending: false,
    isError: false,
    error: null,
  }),
  useConfirmBatch: () => ({ mutateAsync: confirm, isPending: false }),
  useDiscardBatch: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateRow: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useInfiniteRows: () => ({
    isPending: false,
    isError: false,
    data: { pages: [{ data: [], pagination: { hasNextPage: false } }] },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}))

const entity = (valid: number, errors = 0) => ({
  total: valid + errors,
  valid,
  errors,
  conflicts: 0,
  imported: 0,
})

const counts: ImportCounts = {
  total: 6,
  valid: 5,
  errors: 1,
  conflicts: 0,
  alreadyImported: 0,
  imported: 0,
  skipped: 0,
  failed: 0,
  needsReview: 0,
  byEntity: {
    OWNER: entity(2),
    RENTER: entity(0),
    GUARANTOR: entity(0),
    PROPERTY: entity(3, 1),
    CONTRACT: entity(0),
  },
}

const batch: ImportBatchDetail = {
  id: "b1",
  source: "EXCEL",
  status: "READY",
  fileName: "datos.xlsx",
  createdBy: { id: "u1", fullName: "Admin" },
  createdAt: "2026-11-02T10:00:00.000Z",
  confirmedAt: null,
  counts,
  missingSheets: ["Contratos"],
  mastersToCreate: { locations: 1, propertyTypes: 0, amenities: 2 },
  mastersCreated: { locations: 0, propertyTypes: 0, amenities: 0 },
  assets: { migrated: 0, failed: 0, pending: 0 },
  canConfirm: true,
}

const row: ImportRowDto = {
  id: "r1",
  entity: "OWNER",
  rowNumber: 12,
  externalId: null,
  label: "Ana Pérez",
  status: "CONFLICT",
  errors: [],
  conflict: {
    entityId: "o1",
    reason: "Ya existe un propietario con ese DNI.",
    differingFields: ["email"],
  },
  resolution: null,
  excluded: false,
  needsReview: false,
  targetId: null,
}

afterEach(() => {
  vi.clearAllMocks()
  jobStatus = undefined
})

describe("ExcelCard", () => {
  it("rechaza un archivo que no es .xlsx y no deja analizar", async () => {
    render(<ExcelCard />)
    const input = screen.getByLabelText("Archivo .xlsx")
    await userEvent.upload(
      input,
      new File(["a,b"], "datos.csv", { type: "text/csv" }),
      { applyAccept: false }
    )
    expect(screen.getByRole("alert")).toHaveTextContent(/\.xlsx/)
    expect(
      screen.getByRole("button", { name: /Subir y analizar/ })
    ).toBeDisabled()
  })

  it("sube el archivo y va al lote con el trabajo en curso", async () => {
    analyze.mockResolvedValue({ batchId: "b1", jobId: "j1" })
    render(<ExcelCard />)
    const file = new File(["x"], "datos.xlsx")
    await userEvent.upload(screen.getByLabelText("Archivo .xlsx"), file)
    await userEvent.click(
      screen.getByRole("button", { name: /Subir y analizar/ })
    )
    await waitFor(() => expect(analyze).toHaveBeenCalledWith(file))
    expect(push).toHaveBeenCalledWith("/configuracion/migracion/b1?job=j1")
  })
})

describe("RowCard", () => {
  it("muestra los errores de la fila en línea", () => {
    render(
      <RowCard
        row={{
          ...row,
          status: "ERROR",
          conflict: null,
          errors: [
            {
              field: "dni",
              code: "INVALID_DNI",
              message: "Fila 12: el DNI no es válido",
            },
          ],
        }}
        defaultResolution="SKIP"
        editable
        busy={false}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText("Con errores")).toHaveAttribute(
      "data-variant",
      "mora"
    )
    expect(screen.getByText("Fila 12: el DNI no es válido")).toBeInTheDocument()
    // Una fila con errores nunca se importa: no ofrece excluirla.
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })

  it("permite excluir una fila en conflicto y muestra la resolución por defecto", async () => {
    const onChange = vi.fn()
    render(
      <RowCard
        row={row}
        defaultResolution="MERGE_EMPTY_FIELDS"
        editable
        busy={false}
        onChange={onChange}
      />
    )
    expect(screen.getByText(/Campos distintos: email/)).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: /conflicto de Ana Pérez/ })
    ).toHaveTextContent("Completar vacíos")

    await userEvent.click(
      screen.getByRole("checkbox", { name: /No importar esta fila/ })
    )
    expect(onChange).toHaveBeenCalledWith({ excluded: true })
  })

  it("en el resultado es de sólo lectura", () => {
    render(
      <RowCard
        row={row}
        defaultResolution="SKIP"
        editable={false}
        busy={false}
        onChange={vi.fn()}
      />
    )
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })
})

describe("ReviewStep", () => {
  it("avisa de hojas faltantes y maestros, y confirma con el resumen", async () => {
    confirm.mockResolvedValue({ batchId: "b1", jobId: "j2" })
    render(<ReviewStep batch={batch} />)

    expect(screen.getByText(/faltan estas hojas/)).toHaveTextContent(
      "Contratos"
    )
    expect(screen.getByText(/se van a crear/)).toHaveTextContent(
      "1 ubicación, 2 amenities"
    )

    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar importación" })
    )
    expect(
      screen.getByText(/Se crearán 2 propietarios y 3 propiedades\./)
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Importar" }))
    await waitFor(() =>
      expect(confirm).toHaveBeenCalledWith({
        defaultConflictResolution: "SKIP",
        migrateAssets: undefined,
      })
    )
    expect(replace).toHaveBeenCalledWith("/configuracion/migracion/b1?job=j2")
  })

  it("no deja confirmar si no hay nada listo", () => {
    render(<ReviewStep batch={{ ...batch, canConfirm: false }} />)
    expect(
      screen.getByRole("button", { name: "Confirmar importación" })
    ).toBeDisabled()
  })

  it("en Tokko ofrece migrar las fotos", async () => {
    confirm.mockResolvedValue({ batchId: "b1", jobId: "j2" })
    render(<ReviewStep batch={{ ...batch, source: "TOKKO" }} />)
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar importación" })
    )
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Migrar también las fotos" })
    )
    await userEvent.click(screen.getByRole("button", { name: "Importar" }))
    await waitFor(() =>
      expect(confirm).toHaveBeenCalledWith({
        defaultConflictResolution: "SKIP",
        migrateAssets: false,
      })
    )
  })
})

describe("ProgressPanel", () => {
  it("muestra el avance del trabajo", () => {
    jobStatus = {
      status: "PROCESSING",
      progress: 30,
      totalItems: 40,
      processedItems: 12,
      failedItems: 1,
    }
    render(<ProgressPanel title="Analizando los datos…" jobId="j1" />)
    expect(screen.getByText("12 de 40 · 1 con error")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "30"
    )
  })
})

describe("parseLimit", () => {
  it("acepta vacío o un entero positivo", () => {
    expect(parseLimit("")).toBeUndefined()
    expect(parseLimit(" 25 ")).toBe(25)
    expect(parseLimit("0")).toBe("invalid")
    expect(parseLimit("2,5")).toBe("invalid")
    expect(parseLimit("abc")).toBe("invalid")
  })
})
