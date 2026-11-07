import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Field,
  FieldDescription,
  FieldError,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import { Textarea } from "@adminprop/ui/components/textarea"

describe("Field", () => {
  it("enlaza el error con el control por aria-describedby y marca aria-invalid", () => {
    render(
      <Field>
        <Input aria-label="Email" />
        <FieldError>Email inválido</FieldError>
      </Field>
    )
    const input = screen.getByLabelText("Email")
    const error = screen.getByRole("alert")
    expect(error.id).toBeTruthy()
    expect(input.getAttribute("aria-describedby")).toBe(error.id)
    expect(input.getAttribute("aria-invalid")).toBe("true")
  })

  it("sin error no hay aria-describedby ni aria-invalid", () => {
    render(
      <Field>
        <Input aria-label="Email" />
        <FieldError />
      </Field>
    )
    const input = screen.getByLabelText("Email")
    expect(input.hasAttribute("aria-describedby")).toBe(false)
    expect(input.hasAttribute("aria-invalid")).toBe(false)
  })

  it("enlaza descripción y error, en ese orden, también en un Textarea", () => {
    render(
      <Field>
        <Textarea aria-label="Notas" />
        <FieldDescription>Ayuda</FieldDescription>
        <FieldError>Obligatorio</FieldError>
      </Field>
    )
    const ids = [
      screen.getByText("Ayuda").id,
      screen.getByRole("alert").id,
    ].join(" ")
    expect(
      screen.getByLabelText("Notas").getAttribute("aria-describedby")
    ).toBe(ids)
  })

  it("respeta y concatena un aria-describedby explícito", () => {
    render(
      <Field>
        <Input aria-label="Email" aria-describedby="mine" />
        <FieldError>Mal</FieldError>
      </Field>
    )
    const value = screen
      .getByLabelText("Email")
      .getAttribute("aria-describedby")
    expect(value).toBe(`mine ${screen.getByRole("alert").id}`)
  })

  it("marca aria-invalid con data-invalid y respeta uno explícito", () => {
    render(
      <>
        <Field data-invalid="true">
          <Input aria-label="A" />
        </Field>
        <Field>
          <Input aria-label="B" aria-invalid={false} />
          <FieldError>Mal</FieldError>
        </Field>
      </>
    )
    expect(screen.getByLabelText("A").getAttribute("aria-invalid")).toBe("true")
    expect(screen.getByLabelText("B").getAttribute("aria-invalid")).toBe(
      "false"
    )
  })
})
