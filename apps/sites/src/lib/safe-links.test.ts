import { describe, expect, it } from "vitest"

import { mailtoHref, socialHref } from "./safe-links"

describe("socialHref", () => {
  it("acepta solo https", () => {
    expect(socialHref("https://www.instagram.com/demo")).toBe(
      "https://www.instagram.com/demo"
    )
    expect(socialHref("  HTTPS://Facebook.com/demo  ")).toBe(
      "https://facebook.com/demo"
    )
  })

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "http://instagram.com/demo",
    "mailto:a@b.com",
    "tel:+5492215550000",
    "//instagram.com/demo",
    "instagram.com/demo",
    "https://user:pass@instagram.com/demo",
    "https://",
    "",
  ])("rechaza %j", (url) => {
    expect(socialHref(url)).toBeNull()
  })

  it("rechaza lo que no es texto", () => {
    expect(socialHref(null)).toBeNull()
    expect(socialHref(undefined)).toBeNull()
    expect(socialHref(42)).toBeNull()
  })
})

describe("mailtoHref", () => {
  it("acepta un email normal", () => {
    expect(mailtoHref("info@demo.com.ar")).toBe("mailto:info@demo.com.ar")
    expect(mailtoHref("  info@demo.test ")).toBe("mailto:info@demo.test")
  })

  it.each([
    "no-es-un-email",
    "a@b",
    "a b@c.com",
    "a@b.com?bcc=otro@x.com",
    "a@b.com,otro@x.com",
    "a@b.com;otro@x.com",
    '"a"@b.com',
    "a@b.com&subject=x",
    "javascript:alert(1)@x.com",
    "<a@b.com>",
    "",
  ])("rechaza %j", (email) => {
    expect(mailtoHref(email)).toBeNull()
  })

  it("rechaza lo que no es texto", () => {
    expect(mailtoHref(null)).toBeNull()
    expect(mailtoHref(7)).toBeNull()
  })
})
