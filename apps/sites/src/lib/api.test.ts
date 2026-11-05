// @vitest-environment node
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http"
import type { AddressInfo } from "node:net"

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import {
  getFilters,
  getProperties,
  getProperty,
  getSite,
  resolveHost,
  UpstreamError,
} from "./api"
import type { SiteRoute } from "./site-route"

// API pública simulada: un servidor HTTP real, así lo que se prueba es la
// conducta de `fetch` de verdad (corte de conexión, cuelgue, cuerpo roto) y no
// un mock que devuelve lo que el test espera.
type Handler = (req: IncomingMessage, res: ServerResponse) => void

let server: Server
let handler: Handler
const sockets = new Set<import("node:net").Socket>()
const hits: string[] = []

beforeAll(async () => {
  server = createServer((req, res) => {
    hits.push(req.url ?? "")
    handler(req, res)
  })
  server.on("connection", (socket) => {
    sockets.add(socket)
    socket.on("close", () => sockets.delete(socket))
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  process.env.API_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterEach(() => {
  hits.length = 0
  delete process.env.API_TIMEOUT_MS
})

afterAll(async () => {
  for (const socket of sockets) socket.destroy()
  await new Promise((resolve) => server.close(resolve))
})

const route: SiteRoute = { mode: "dev", slug: "oppido", previewToken: null }

function json(status: number, body: unknown): Handler {
  return (_req, res) => {
    res.writeHead(status, { "Content-Type": "application/json" })
    res.end(JSON.stringify(body))
  }
}

const ok = (data: unknown) => json(200, { success: true, message: null, data })

describe("cliente de la API pública", () => {
  it("devuelve `data` cuando la API responde 200", async () => {
    handler = ok({ slug: "oppido" })
    await expect(getSite(route)).resolves.toEqual({ slug: "oppido" })
    expect(hits).toEqual(["/public/oppido/site"])
  })

  it("devuelve un listado vacío tal cual: «no hay datos» no es una falla", async () => {
    const empty = {
      data: [],
      pagination: { page: 1, total: 0, totalPages: 0 },
    }
    handler = ok(empty)
    await expect(getProperties(route, {})).resolves.toEqual(empty)
  })

  it("un 404 de la API es `null` (no existe), no un error", async () => {
    handler = json(404, { success: false, message: "No existe" })
    await expect(getSite(route)).resolves.toBeNull()
    await expect(getProperty(route, "x")).resolves.toBeNull()
    await expect(getFilters(route)).resolves.toBeNull()
  })

  it.each([500, 502, 503, 504])(
    "un %i de la API es UpstreamError con su estado",
    async (status) => {
      handler = json(status, { success: false, message: "caída" })
      await expect(getSite(route)).rejects.toMatchObject({
        name: "UpstreamError",
        status,
      })
    }
  )

  it("un 429 (rate limit) también es una falla, no un «no existe»", async () => {
    handler = json(429, { success: false, message: "Demasiados pedidos" })
    const error = await getSite(route).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(UpstreamError)
    expect((error as UpstreamError).status).toBe(429)
  })

  it("un 401/403 tampoco se confunde con un 404", async () => {
    handler = json(403, { success: false, message: "Prohibido" })
    await expect(getSite(route)).rejects.toBeInstanceOf(UpstreamError)
  })

  it("la conexión cortada a mitad de respuesta es UpstreamError sin estado", async () => {
    handler = (req) => req.socket.destroy()
    const error = await getSite(route).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(UpstreamError)
    expect((error as UpstreamError).status).toBeNull()
  })

  it("un servidor que no responde corta por tiempo y falla como UpstreamError", async () => {
    process.env.API_TIMEOUT_MS = "150"
    handler = () => {
      // No responde nunca.
    }
    const started = Date.now()
    const error = await getSite(route).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(UpstreamError)
    expect((error as UpstreamError).status).toBeNull()
    expect(Date.now() - started).toBeLessThan(3000)
  })

  it("un cuerpo que se cuelga después de los headers también corta por tiempo", async () => {
    process.env.API_TIMEOUT_MS = "150"
    handler = (_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.write('{"success":true,"data":')
      // Nunca termina el cuerpo.
    }
    await expect(getSite(route)).rejects.toBeInstanceOf(UpstreamError)
  })

  it("un 200 con un cuerpo que no es JSON es UpstreamError", async () => {
    handler = (_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end("<html>Bad gateway</html>")
    }
    const error = await getSite(route).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(UpstreamError)
    expect((error as UpstreamError).status).toBe(200)
  })

  it("un 200 sin `data` es UpstreamError", async () => {
    handler = json(200, { success: true })
    await expect(getSite(route)).rejects.toBeInstanceOf(UpstreamError)
    handler = json(200, null)
    await expect(getSite(route)).rejects.toBeInstanceOf(UpstreamError)
  })

  it("sin API_URL configurada es UpstreamError, no un sitio inexistente", async () => {
    const saved = process.env.API_URL
    delete process.env.API_URL
    delete process.env.NEXT_PUBLIC_API_URL
    try {
      await expect(getSite(route)).rejects.toBeInstanceOf(UpstreamError)
    } finally {
      process.env.API_URL = saved
    }
  })

  it("resolveHost distingue encontrado, inexistente y falla", async () => {
    handler = ok({ slug: "oppido" })
    await expect(resolveHost("oppido.example.com")).resolves.toEqual({
      status: "found",
      slug: "oppido",
    })
    handler = json(404, { success: false, message: "No existe" })
    await expect(resolveHost("x.example.com")).resolves.toEqual({
      status: "missing",
    })
    handler = json(503, { success: false, message: "caída" })
    await expect(resolveHost("x.example.com")).resolves.toEqual({
      status: "error",
    })
  })
})
