import { beforeEach, describe, expect, it } from "vitest"

import {
  clearAllDrafts,
  DRAFT_TTL_MS,
  loadDraft,
  removeDraft,
  saveDraft,
} from "./form-draft"

const KEY = "adminprop:contract-draft"

beforeEach(() => window.localStorage.clear())

describe("form-draft", () => {
  it("guarda y recupera el borrador", () => {
    saveDraft(KEY, { rent: "100" })
    expect(loadDraft(KEY)).toEqual({ rent: "100" })
  })

  it("no guarda los campos omitidos ni los que parecen sensibles, en ningún nivel", () => {
    saveDraft(
      KEY,
      {
        rent: "100",
        notes: "texto libre",
        guarantorDni: "30123456",
        cbu: "0000",
        nested: { aliasCbu: "x", keep: "ok" },
      },
      ["notes"]
    )
    expect(loadDraft(KEY)).toEqual({ rent: "100", nested: { keep: "ok" } })
    const raw = window.localStorage.getItem(KEY) ?? ""
    expect(raw).not.toContain("30123456")
    expect(raw).not.toContain("texto libre")
  })

  it("el borrador vencido se ignora y se borra", () => {
    const now = Date.now()
    saveDraft(KEY, { rent: "100" }, [], now - DRAFT_TTL_MS - 1)
    expect(loadDraft(KEY, now)).toBeNull()
    expect(window.localStorage.getItem(KEY)).toBeNull()
  })

  it("un valor con el formato viejo (sin sobre) o dañado se descarta", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ rent: "100" }))
    expect(loadDraft(KEY)).toBeNull()
    window.localStorage.setItem(KEY, "{no es json")
    expect(loadDraft(KEY)).toBeNull()
  })

  it("clearAllDrafts borra solo los borradores", () => {
    saveDraft("adminprop:contract-draft", { a: 1 })
    saveDraft("adminprop:property-draft", { a: 1 })
    window.localStorage.setItem("otra-cosa", "1")
    clearAllDrafts()
    expect(window.localStorage.getItem("adminprop:contract-draft")).toBeNull()
    expect(window.localStorage.getItem("adminprop:property-draft")).toBeNull()
    expect(window.localStorage.getItem("otra-cosa")).toBe("1")
  })

  it("removeDraft borra uno", () => {
    saveDraft(KEY, { a: 1 })
    removeDraft(KEY)
    expect(loadDraft(KEY)).toBeNull()
  })
})
