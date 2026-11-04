import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { makeSite, ROUTE } from "@/test-fixtures"
import { templateKit } from "@/templates"

import { SocialLink } from "./icons"

describe("SocialLink", () => {
  it("renderiza un link https con noopener", () => {
    render(<SocialLink network="INSTAGRAM" url="https://instagram.com/demo" />)
    const link = screen.getByRole("link", { name: "Instagram" })
    expect(link).toHaveAttribute("href", "https://instagram.com/demo")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://instagram.com/demo",
    "vbscript:x",
    "mailto:a@b.com",
    "",
  ])("con %j no renderiza nada", (url) => {
    const { container } = render(<SocialLink network="FACEBOOK" url={url} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe.each(["CLASSIC", "MODERN"] as const)(
  "links de contacto del template %s",
  (key) => {
    const kit = templateKit(key)

    it("un esquema peligroso en redes o un email trucho no llega a ningún href", () => {
      const site = makeSite(key)
      site.content.contact.socials = [
        { network: "INSTAGRAM", url: "javascript:alert(1)" },
        { network: "FACEBOOK", url: "data:text/html,x" },
        { network: "YOUTUBE", url: "http://youtube.com/x" },
        { network: "LINKEDIN", url: "https://linkedin.com/company/demo" },
      ]
      site.content.contact.email = "a@b.com?bcc=victima@x.com"
      const Contact = kit.sections.contact
      const { container } = render(
        <>
          <kit.Footer site={site} route={ROUTE} />
          <Contact site={site} route={ROUTE} featured={[]} filters={null} />
        </>
      )

      const hrefs = [...container.querySelectorAll("a[href]")].map((a) =>
        a.getAttribute("href")
      )
      expect(
        hrefs.some((h) => /^(javascript|data|vbscript):/i.test(h ?? ""))
      ).toBe(false)
      expect(hrefs).not.toContain("http://youtube.com/x")
      expect(hrefs.some((h) => h?.startsWith("mailto:"))).toBe(false)
      // Lo válido sigue estando.
      expect(hrefs).toContain("https://linkedin.com/company/demo")
    })
  }
)
