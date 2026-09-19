import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "next-themes"
import { describe, expect, it } from "vitest"

import { ThemeToggle } from "./theme-toggle"

describe("ThemeToggle", () => {
  it("pone y saca la clase dark en <html>", async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole("button", {
      name: "Cambiar entre modo claro y oscuro",
    })

    await user.click(button)
    expect(document.documentElement).toHaveClass("dark")

    await user.click(button)
    expect(document.documentElement).not.toHaveClass("dark")
  })
})
