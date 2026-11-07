import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { WhatsAppTemplateDto } from "@adminprop/shared-types"

import { TenantNameProvider } from "./tenant-name"
import { WhatsAppButton } from "./whatsapp-button"

let templates: WhatsAppTemplateDto[] = []

vi.mock("@/lib/notifications-api", () => ({
  useWhatsAppTemplates: () => ({ data: templates }),
}))

const reminder: WhatsAppTemplateDto = {
  key: "PAYMENT_REMINDER",
  title: "Recordatorio de pago",
  body: "Hola {{recipientName}}, te escribe {{agencyName}}: tu cuota de {{amount}} vence el {{dueDate}}.",
  variables: [],
  isCustomized: false,
}

describe("WhatsAppButton", () => {
  it("se oculta sin teléfono", () => {
    templates = [reminder]
    render(
      <WhatsAppButton
        phone={null}
        templateKeys={["PAYMENT_REMINDER"]}
        values={{}}
      />
    )
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("sin plantillas queda un link directo", () => {
    templates = []
    render(
      <WhatsAppButton
        phone="011 15 1234-5678"
        templateKeys={["PAYMENT_REMINDER"]}
        values={{}}
      />
    )
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      "https://wa.me/5491112345678"
    )
  })

  it("arma el link con el texto de la plantilla elegida", async () => {
    templates = [reminder]
    render(
      <TenantNameProvider name="Inmobiliaria Sur">
        <WhatsAppButton
          phone="1123456789"
          templateKeys={["PAYMENT_REMINDER", "ARREARS"]}
          values={{
            recipientName: "Ana",
            amount: "$ 150.000,00",
            dueDate: "10/11/2026",
          }}
        />
      </TenantNameProvider>
    )

    await userEvent.click(screen.getByRole("button", { name: /WhatsApp/ }))
    const link = await screen.findByRole("menuitem", {
      name: "Recordatorio de pago",
    })
    const href = link.getAttribute("href")!
    const url = new URL(href)
    expect(url.origin + url.pathname).toBe("https://wa.me/5491123456789")
    expect(url.searchParams.get("text")).toBe(
      "Hola Ana, te escribe Inmobiliaria Sur: tu cuota de $ 150.000,00 vence el 10/11/2026."
    )
  })
})
