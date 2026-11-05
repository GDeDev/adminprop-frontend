import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { JsonLd } from "./json-ld"

describe("JsonLd", () => {
  it("escapa < para que un texto no pueda cerrar el script", () => {
    const { container } = render(
      <JsonLd data={{ description: "</script><script>alert(1)</script>" }} />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.textContent).not.toContain("<")
    expect(script?.textContent).toContain("\\u003c/script>")
    expect(JSON.parse(script?.textContent ?? "{}").description).toBe(
      "</script><script>alert(1)</script>"
    )
    expect(container.querySelectorAll("script")).toHaveLength(1)
  })
})
