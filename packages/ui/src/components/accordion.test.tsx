import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion"

describe("Accordion", () => {
  it("abre y cierra el contenido desde el botón", async () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Marca</AccordionTrigger>
          <AccordionContent>Contenido de marca</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
    const user = userEvent.setup()
    const trigger = screen.getByRole("button", { name: "Marca" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")

    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Contenido de marca")).toBeVisible()

    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })
})
