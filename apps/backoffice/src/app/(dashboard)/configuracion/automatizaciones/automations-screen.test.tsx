import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { Job, JobExecution } from "@adminprop/shared-types"

import { AutomationsScreen } from "./automations-screen"

let role: "ADMIN" | "EMPLOYEE" = "ADMIN"
const run = vi.fn()
let jobs: Job[] = []
let executions: JobExecution[] = []

vi.mock("@adminprop/session/client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@adminprop/session/client")>()
  return { ...actual, useSession: () => ({ user: { id: "u1", role } }) }
})

vi.mock("@/lib/automations-api", () => ({
  useJobs: () => ({ isPending: false, isError: false, data: jobs }),
  useInfiniteExecutions: () => ({
    isPending: false,
    isError: false,
    data: {
      pages: [
        {
          data: executions,
          pagination: {
            page: 1,
            limit: 20,
            total: executions.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      ],
    },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
  useRunJob: () => ({ mutateAsync: run, isPending: false }),
}))

const execution: JobExecution = {
  id: "e1",
  job: "installments.generate",
  tenantId: "t1",
  scheduledFor: "2026-10-28",
  startedAt: "2026-10-28T00:10:00.000Z",
  finishedAt: "2026-10-28T00:10:02.000Z",
  status: "SUCCEEDED",
  affected: 12,
  summary: "12 cuotas creadas, 3 ya existían",
  error: null,
  triggeredBy: "SCHEDULE",
  triggeredByUser: null,
}

afterEach(() => {
  vi.clearAllMocks()
  role = "ADMIN"
})

describe("AutomationsScreen", () => {
  it("lista los jobs con su última ejecución y el historial", () => {
    jobs = [
      {
        name: "installments.generate",
        title: "Generar cuotas del mes",
        description: "Una cuota por contrato activo.",
        cron: "10 0 * * *",
        cronLabel: "todos los días a las 00:10",
        scope: "TENANT",
        lastExecution: execution,
        nextRunAt: "2026-10-30T03:10:00.000Z",
      },
      {
        name: "indices.fetch",
        title: "Traer índices",
        description: "ICL del BCRA e IPC del INDEC.",
        cron: "0 6,12 * * *",
        cronLabel: "todos los días a las 06:00 y 12:00",
        scope: "GLOBAL",
        lastExecution: {
          ...execution,
          id: "e2",
          job: "indices.fetch",
          status: "FAILED",
          error: "BCRA no responde",
          summary: null,
          tenantId: null,
        },
        nextRunAt: null,
      },
    ]
    executions = [execution]
    render(<AutomationsScreen />)

    expect(
      screen.getByRole("heading", { name: "Generar cuotas del mes" })
    ).toBeInTheDocument()
    expect(screen.getAllByText(/12 cuotas creadas, 3 ya existían/).length).toBe(
      2
    )
    expect(screen.getAllByText("OK").length).toBeGreaterThan(0)
    expect(screen.getByText("Falló")).toBeInTheDocument()
    expect(screen.getByText("BCRA no responde")).toBeInTheDocument()
    expect(
      screen.getByText(/global, para todas las inmobiliarias/)
    ).toBeInTheDocument()
    const history = screen.getByRole("region", {
      name: "Historial de ejecuciones",
    })
    expect(within(history).getByText("Programada")).toBeInTheDocument()
  })

  it("ejecuta un job a mano con el mes cuando corresponde", async () => {
    jobs = [
      {
        name: "installments.generate",
        title: "Generar cuotas del mes",
        description: "Una cuota por contrato activo.",
        cron: "10 0 * * *",
        cronLabel: "todos los días a las 00:10",
        scope: "TENANT",
        lastExecution: null,
        nextRunAt: null,
      },
    ]
    executions = []
    run.mockResolvedValue({ executionId: "e9" })
    const user = userEvent.setup()
    render(<AutomationsScreen />)

    expect(screen.getByText("Todavía no corrió.")).toBeInTheDocument()
    await user.click(
      screen.getByRole("button", {
        name: "Ejecutar Generar cuotas del mes ahora",
      })
    )
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByLabelText("Mes")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Ejecutar" }))
    expect(run).toHaveBeenCalledWith({
      job: "installments.generate",
      period: expect.stringMatching(/^\d{4}-\d{2}$/),
    })
  })

  it("un empleado no entra", () => {
    role = "EMPLOYEE"
    jobs = []
    executions = []
    render(<AutomationsScreen />)
    expect(screen.getByText("Sólo para administradores")).toBeInTheDocument()
  })
})
