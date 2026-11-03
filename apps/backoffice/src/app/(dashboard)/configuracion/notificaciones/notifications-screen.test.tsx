import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  NotificationLogItem,
  NotificationTemplateDto,
  NotificationTypeSetting,
} from "@adminprop/shared-types"

import { HistoryTab, NotificationCard } from "./history-tab"
import { SettingRow } from "./settings-tab"
import { TemplateEditor } from "./templates-tab"

const preview = vi.fn()
const updateTemplate = vi.fn()
const resendFailed = vi.fn()
let jobStatus: unknown = undefined

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

vi.mock("@/lib/notifications-api", () => ({
  usePreviewTemplate: () => ({
    mutate: preview,
    data: {
      subject: "Recordatorio",
      text: "Hola Ana",
      html: "<p>Hola Ana</p>",
    },
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateNotificationTemplate: () => ({
    mutateAsync: updateTemplate,
    isPending: false,
  }),
  useRestoreNotificationTemplate: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useSendTemplateTest: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useInfiniteNotifications: () => ({
    isPending: false,
    isError: false,
    data: { pages: [{ data: [failed], pagination: { hasNextPage: false } }] },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
  useNotification: () => ({ isPending: true }),
  useResendNotification: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useResendFailed: () => ({ mutateAsync: resendFailed, isPending: false }),
  useRefreshNotifications: () => vi.fn(),
}))

vi.mock("@/lib/jobs-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/jobs-api")>()),
  useJobStatus: () => ({ data: jobStatus, isError: false }),
}))

const failed: NotificationLogItem = {
  id: "n1",
  type: "ARREARS_NOTICE",
  templateKey: "ARREARS_NOTICE.EMAIL",
  channel: "EMAIL",
  status: "FAILED",
  skipReason: null,
  recipientKind: "RENTER",
  recipientLabel: "Ana Pérez",
  recipientEmail: "ana@example.com",
  entityType: null,
  entityId: null,
  attempts: 4,
  nextAttemptAt: null,
  lastError: "Dominio no verificado",
  sentAt: null,
  deliveredAt: null,
  openedAt: null,
  bouncedAt: null,
  createdAt: "2026-11-02T10:00:00.000Z",
}

const template: NotificationTemplateDto = {
  key: "PAYMENT_REMINDER.EMAIL",
  type: "PAYMENT_REMINDER",
  channel: "EMAIL",
  title: "Recordatorio de pago",
  subject: "Tu cuota de {{period}}",
  bodyText: "Hola {{recipientName}}, ",
  variables: [
    { name: "recipientName", label: "Nombre", example: "Ana" },
    { name: "period", label: "Período", example: "11/2026" },
  ],
  isCustomized: false,
  updatedAt: null,
}

afterEach(() => {
  vi.clearAllMocks()
  jobStatus = undefined
})

describe("NotificationCard", () => {
  it("muestra estado con token, error y destinatario", () => {
    render(<NotificationCard item={failed} onOpen={vi.fn()} />)
    expect(screen.getByText("Fallida")).toHaveAttribute("data-variant", "mora")
    expect(screen.getByText("Dominio no verificado")).toBeInTheDocument()
    expect(screen.getByText(/Ana Pérez/)).toBeInTheDocument()
    expect(screen.getByText(/4 intentos/)).toBeInTheDocument()
  })
})

describe("SettingRow", () => {
  const base: NotificationTypeSetting = {
    type: "PAYMENT_REMINDER",
    title: "Recordatorio de pago",
    description: "Antes del vencimiento",
    audience: "Inquilino",
    enabled: true,
    channels: ["EMAIL"],
    availableChannels: ["EMAIL", "WHATSAPP_LINK"],
    mandatory: false,
  }

  it("cambia el interruptor y los canales", async () => {
    const onChange = vi.fn()
    render(<SettingRow setting={base} saving={false} onChange={onChange} />)

    await userEvent.click(screen.getByRole("switch"))
    expect(onChange).toHaveBeenLastCalledWith({ enabled: false })

    await userEvent.click(screen.getByRole("button", { name: "WhatsApp" }))
    expect(onChange).toHaveBeenLastCalledWith({
      channels: ["EMAIL", "WHATSAPP_LINK"],
    })
  })

  it("un tipo obligatorio queda bloqueado", () => {
    render(
      <SettingRow
        setting={{ ...base, mandatory: true }}
        saving={false}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByRole("switch")).toBeDisabled()
    expect(screen.getByRole("button", { name: "Email" })).toBeDisabled()
    expect(screen.getByText("Obligatorio")).toBeInTheDocument()
  })
})

describe("TemplateEditor", () => {
  it("inserta variables, valida las desconocidas y guarda", async () => {
    updateTemplate.mockResolvedValue(template)
    render(<TemplateEditor template={template} />)

    const save = screen.getByRole("button", { name: "Guardar" })
    expect(save).toBeDisabled()

    await userEvent.click(screen.getByRole("button", { name: "Período" }))
    expect(screen.getByLabelText("Texto")).toHaveValue(
      "Hola {{recipientName}}, {{period}}"
    )
    expect(save).toBeEnabled()

    await userEvent.click(screen.getByLabelText("Asunto"))
    await userEvent.paste(" {{foo}}")
    expect(screen.getByRole("alert")).toHaveTextContent("{{foo}}")
    expect(save).toBeDisabled()
  })

  it("pide la vista previa y deshabilita la prueba con cambios sin guardar", async () => {
    render(<TemplateEditor template={template} />)
    await waitFor(() => expect(preview).toHaveBeenCalled())
    expect(preview).toHaveBeenLastCalledWith({
      key: "PAYMENT_REMINDER.EMAIL",
      subject: template.subject,
      bodyText: template.bodyText,
    })
    expect(screen.getByTitle("Vista previa del email")).toBeInTheDocument()

    const test = screen.getByRole("button", { name: /Enviarme una prueba/ })
    expect(test).toBeEnabled()
    await userEvent.type(screen.getByLabelText("Asunto"), "x")
    expect(test).toBeDisabled()
  })

  it("restaurar solo aparece en plantillas personalizadas", () => {
    const { rerender } = render(<TemplateEditor template={template} />)
    expect(
      screen.queryByRole("button", { name: /Restaurar original/ })
    ).not.toBeInTheDocument()
    rerender(<TemplateEditor template={{ ...template, isCustomized: true }} />)
    expect(
      screen.getByRole("button", { name: /Restaurar original/ })
    ).toBeInTheDocument()
  })
})

describe("HistoryTab", () => {
  it("reintenta todas las fallidas y muestra el avance del trabajo", async () => {
    resendFailed.mockResolvedValue({ jobId: "job-1" })
    jobStatus = {
      id: "job-1",
      type: "notifications-resend-failed",
      status: "PROCESSING",
      totalItems: 30,
      processedItems: 12,
      failedItems: 1,
      progress: 40,
      result: null,
      startedAt: "2026-11-02T10:00:00.000Z",
      finishedAt: null,
    }
    render(<HistoryTab />)

    await userEvent.click(
      screen.getByRole("button", { name: /Reintentar todas las fallidas/ })
    )
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }))

    expect(resendFailed).toHaveBeenCalledWith({
      from: undefined,
      to: undefined,
      type: undefined,
    })
    expect(await screen.findByText("12 de 30 · 1 con error")).toBeVisible()
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "40"
    )
  })
})
