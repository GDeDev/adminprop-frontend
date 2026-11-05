import { beforeEach, describe, expect, it, vi } from "vitest"

import { UpstreamError } from "@/lib/api"
import { FILTERS, makeSite, PROPERTY } from "@/test-fixtures"

const api = vi.hoisted(() => ({
  getSite: vi.fn(),
  getProperties: vi.fn(),
  getProperty: vi.fn(),
  getFilters: vi.fn(),
}))

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  ...api,
}))

import FavoritesPage from "./favoritos/page"
import SiteLayout, { generateMetadata as layoutMetadata } from "./layout"
import HomePage, { generateMetadata as homeMetadata } from "./page"
import PropertyPage, {
  generateMetadata as propertyMetadata,
} from "./propiedades/[id]/page"
import PropertiesPage, {
  generateMetadata as listingMetadata,
} from "./propiedades/page"

const SEGMENT = "d~demo"
const ID = PROPERTY.id
const site = makeSite()
const page = {
  data: [PROPERTY],
  pagination: { page: 1, total: 1, totalPages: 1 },
}
const emptyPage = {
  data: [],
  pagination: { page: 1, total: 0, totalPages: 0 },
}

// Las maneras en que la API puede fallar: red/timeout (sin estado), 5xx y 429.
const FAILURES: [string, UpstreamError][] = [
  ["red caída o timeout", new UpstreamError("sin respuesta", null)],
  ["un 500", new UpstreamError("La API respondió 500", 500)],
  ["un 503", new UpstreamError("La API respondió 503", 503)],
  ["un 429", new UpstreamError("La API respondió 429", 429)],
]

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest: unknown }).digest).includes("404")
  )
}

async function outcome(run: () => Promise<unknown>) {
  try {
    return { value: await run(), error: undefined }
  } catch (error) {
    return { value: undefined, error }
  }
}

const params = Promise.resolve({ site: SEGMENT })
const idParams = Promise.resolve({ site: SEGMENT, id: ID })
const search = Promise.resolve({})
const sharedSearch = Promise.resolve({ ids: ID })

beforeEach(() => {
  vi.resetAllMocks()
  api.getSite.mockResolvedValue(site)
  api.getProperties.mockResolvedValue(page)
  api.getProperty.mockResolvedValue({
    ...PROPERTY,
    photos: [],
    features: [],
    amenities: [],
  })
  api.getFilters.mockResolvedValue(FILTERS)
})

type Call = "getSite" | "getProperties" | "getProperty" | "getFilters"

/** Cada página, con los pedidos a la API que, si fallan, tienen que subir. */
const PAGES: { name: string; render: () => Promise<unknown>; fails: Call[] }[] =
  [
    {
      name: "la home",
      render: () => HomePage({ params }),
      fails: ["getSite", "getProperties", "getFilters"],
    },
    {
      name: "el listado",
      render: () => PropertiesPage({ params, searchParams: search }),
      fails: ["getSite", "getProperties", "getFilters"],
    },
    {
      name: "la ficha",
      render: () => PropertyPage({ params: idParams }),
      fails: ["getSite", "getProperty", "getProperties"],
    },
    {
      name: "favoritos compartidos",
      render: () => FavoritesPage({ params, searchParams: sharedSearch }),
      fails: ["getSite", "getProperties"],
    },
  ]

describe.each(PAGES)("$name con la API caída", ({ render, fails }) => {
  describe.each(fails)("falla %s", (call) => {
    it.each(FAILURES)(
      "por %s: lanza UpstreamError, no publica nada degradado",
      async (_label, failure) => {
        api[call].mockRejectedValue(failure)
        const result = await outcome(render)
        expect(result.error).toBe(failure)
        expect(isNotFound(result.error)).toBe(false)
      }
    )
  })
})

describe("generateMetadata con la API caída", () => {
  it.each(FAILURES)(
    "por %s: lanza en vez de devolver metadatos vacíos",
    async (_label, failure) => {
      api.getSite.mockRejectedValue(failure)
      for (const run of [
        () => layoutMetadata({ params }),
        () => homeMetadata({ params }),
        () => listingMetadata({ params, searchParams: search }),
        () => propertyMetadata({ params: idParams }),
      ]) {
        expect((await outcome(run)).error).toBe(failure)
      }
    }
  )

  it.each(FAILURES)(
    "de la ficha por %s: lanza, no dice «Propiedad no disponible»",
    async (_label, failure) => {
      api.getProperty.mockRejectedValue(failure)
      const result = await outcome(() => propertyMetadata({ params: idParams }))
      expect(result.error).toBe(failure)
    }
  )
})

describe("el layout con la API caída", () => {
  it.each(FAILURES)(
    "por %s: lanza para que Next conserve la versión anterior",
    async (_label, failure) => {
      api.getSite.mockRejectedValue(failure)
      const result = await outcome(() => SiteLayout({ params, children: null }))
      expect(result.error).toBe(failure)
    }
  )
})

describe("404 solo cuando la API confirma que no existe", () => {
  it("sitio inexistente: todas las páginas y el layout dan 404", async () => {
    api.getSite.mockResolvedValue(null)
    for (const { render } of PAGES) {
      expect(isNotFound((await outcome(render)).error)).toBe(true)
    }
    const layout = await outcome(() => SiteLayout({ params, children: null }))
    expect(isNotFound(layout.error)).toBe(true)
  })

  it("ficha inexistente (la API devuelve 404): 404", async () => {
    api.getProperty.mockResolvedValue(null)
    const result = await outcome(() => PropertyPage({ params: idParams }))
    expect(isNotFound(result.error)).toBe(true)
  })

  it("un id que no es UUID da 404 sin llamar a la API de la ficha", async () => {
    const bad = Promise.resolve({ site: SEGMENT, id: "no-es-uuid" })
    const result = await outcome(() => PropertyPage({ params: bad }))
    expect(isNotFound(result.error)).toBe(true)
    expect(api.getProperty).not.toHaveBeenCalled()
  })

  it("un listado cuyo sitio desapareció (404 de la API) da 404", async () => {
    api.getProperties.mockResolvedValue(null)
    const result = await outcome(() =>
      PropertiesPage({ params, searchParams: search })
    )
    expect(isNotFound(result.error)).toBe(true)
  })
})

describe("«no hay datos» sigue siendo una página normal", () => {
  it("un listado vacío se renderiza (ni falla ni 404)", async () => {
    api.getProperties.mockResolvedValue(emptyPage)
    const result = await outcome(() =>
      PropertiesPage({ params, searchParams: search })
    )
    expect(result.error).toBeUndefined()
    expect(result.value).toBeTruthy()
  })

  it("la home sin destacadas se renderiza", async () => {
    api.getProperties.mockResolvedValue(emptyPage)
    const result = await outcome(() => HomePage({ params }))
    expect(result.error).toBeUndefined()
  })

  it("favoritos compartidos que ya no existen se renderizan con su aviso", async () => {
    api.getProperties.mockResolvedValue(emptyPage)
    const result = await outcome(() =>
      FavoritesPage({ params, searchParams: sharedSearch })
    )
    expect(result.error).toBeUndefined()
  })
})
