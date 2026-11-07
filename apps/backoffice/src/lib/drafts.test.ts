import { beforeEach, describe, expect, it } from "vitest"

import { clearDrafts, draftKey } from "./drafts"

beforeEach(() => window.localStorage.clear())

describe("draftKey", () => {
  it("separa por inmobiliaria y usuario", () => {
    const a = draftKey("contract", { id: "u1", tenantId: "t1" })
    const b = draftKey("contract", { id: "u2", tenantId: "t1" })
    const c = draftKey("contract", { id: "u1", tenantId: "t2" })
    expect(new Set([a, b, c]).size).toBe(3)
    expect(draftKey("property", { id: "u1", tenantId: "t1" })).not.toBe(a)
  })

  it("sin usuario no hay clave (no se guarda nada)", () => {
    expect(draftKey("contract", null)).toBeNull()
  })
})

describe("clearDrafts", () => {
  it("borra todos los borradores, también los viejos sin usuario, y nada más", () => {
    const store = window.localStorage
    store.setItem("adminprop:contract-draft:t1:u1", "{}")
    store.setItem("adminprop:property-draft:t1:u2", "{}")
    store.setItem("adminprop:contract-draft", "{}")
    store.setItem("adminprop:property-draft", "{}")
    store.setItem("theme", "dark")

    clearDrafts()

    expect(store.length).toBe(1)
    expect(store.getItem("theme")).toBe("dark")
  })
})
