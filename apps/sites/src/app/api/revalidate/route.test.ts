import { revalidateTag } from "next/cache"
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { siteTag } from "@/lib/api"
import { clearHostCache } from "@/lib/host-cache"

import { POST } from "./route"

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))
vi.mock("@/lib/host-cache", () => ({ clearHostCache: vi.fn() }))

function post(headers: Record<string, string>, body?: unknown) {
  return new NextRequest("http://localhost:3003/api/revalidate", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body ?? {}),
  })
}

const bearer = (secret: string) => ({ authorization: `Bearer ${secret}` })

describe("POST /api/revalidate", () => {
  const previousSecret = process.env.SITES_REVALIDATE_SECRET

  beforeEach(() => {
    process.env.SITES_REVALIDATE_SECRET = "s3"
    vi.mocked(revalidateTag).mockClear()
    vi.mocked(clearHostCache).mockClear()
  })
  afterEach(() => {
    if (previousSecret === undefined) delete process.env.SITES_REVALIDATE_SECRET
    else process.env.SITES_REVALIDATE_SECRET = previousSecret
    vi.restoreAllMocks()
  })

  it("sin SITES_REVALIDATE_SECRET el endpoint está apagado (404)", async () => {
    delete process.env.SITES_REVALIDATE_SECRET
    const response = await POST(post(bearer("s3"), { slug: "mi-inmo" }))

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ ok: false })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("un Bearer incorrecto es 401", async () => {
    const response = await POST(post(bearer("mal"), { slug: "mi-inmo" }))

    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("sin header Authorization es 401", async () => {
    const response = await POST(post({}, { slug: "mi-inmo" }))

    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("el secreto se compara por valor exacto: s3x es 401", async () => {
    const response = await POST(post(bearer("s3x"), { slug: "mi-inmo" }))

    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("un slug inválido es 400", async () => {
    const response = await POST(post(bearer("s3"), { slug: "A B" }))

    expect(response.status).toBe(400)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("un body que no es JSON es 400", async () => {
    const response = await POST(post(bearer("s3"), "esto no es json"))

    expect(response.status).toBe(400)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("un slug que no es string es 400", async () => {
    const response = await POST(post(bearer("s3"), { slug: 123 }))

    expect(response.status).toBe(400)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("con Bearer y slug válidos invalida el tag del sitio y limpia la caché de hosts", async () => {
    const response = await POST(post(bearer("s3"), { slug: "mi-inmo" }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(revalidateTag).toHaveBeenCalledWith(siteTag("mi-inmo"), {
      expire: 0,
    })
    expect(clearHostCache).toHaveBeenCalledTimes(1)
  })
})
