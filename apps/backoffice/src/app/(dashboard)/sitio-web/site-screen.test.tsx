import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError } from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { SiteDomain, SiteSettings } from "@adminprop/shared-types"

import { makeSettings, makeTemplates } from "../../../../test/site-fixtures"
import { SiteScreen } from "./site-screen"

let role = "ADMIN"
let settings: SiteSettings
const update = vi.fn()
const verifyDomain = vi.fn()
let domainState: SiteDomain
const reset = vi.fn()
const publish = vi.fn()
const unpublish = vi.fn()
const push = vi.fn()

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role } }),
}))
vi.mock("@/lib/tenant-settings-api", () => ({
  useTenantSettings: () => ({ data: { slug: "oppido" } }),
}))
vi.mock("@/lib/properties-api", () => ({
  useProperty: () => ({ data: undefined, isError: false }),
  useInfiniteProperties: () => ({
    data: undefined,
    isPending: false,
    hasNextPage: false,
  }),
}))
vi.mock("@/lib/site-api", () => ({
  useSiteSettings: () => ({
    isPending: false,
    isError: false,
    data: settings,
    refetch: vi.fn(),
  }),
  useSiteTemplates: () => ({
    isPending: false,
    isError: false,
    data: makeTemplates(),
    refetch: vi.fn(),
  }),
  useUpdateSiteSettings: () => ({ mutateAsync: update, isPending: false }),
  useResetSiteTemplate: () => ({ mutateAsync: reset, isPending: false }),
  usePublishSite: () => ({ mutateAsync: publish, isPending: false }),
  useUnpublishSite: () => ({ mutateAsync: unpublish, isPending: false }),
  useUploadSiteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSitePreviewToken: () => ({
    isPending: false,
    isError: false,
    data: { token: "tok-123", expiresAt: "2099-01-01T00:00:00Z" },
    refetch: vi.fn(),
  }),
  useSubdomainAvailability: () => ({
    data: undefined,
    isFetching: false,
    isError: false,
  }),
  useSiteDomain: () => ({
    isPending: false,
    isError: false,
    data: domainState,
    refetch: vi.fn(),
  }),
  useVerifySiteDomain: () => ({ mutateAsync: verifyDomain, isPending: false }),
}))

function apiFailure(errors: { field?: string; message: string }[]) {
  return new AxiosError("422", "ERR", undefined, undefined, {
    status: 422,
    statusText: "",
    headers: {},
    config: {} as never,
    data: { message: "Validación fallida", errors },
  })
}

beforeEach(() => {
  role = "ADMIN"
  settings = makeSettings()
  domainState = {
    customDomain: null,
    verified: false,
    verifiedAt: null,
    verificationRequired: true,
    record: null,
  }
  verifyDomain.mockResolvedValue(undefined)
  update.mockResolvedValue(undefined)
  reset.mockResolvedValue(undefined)
  publish.mockResolvedValue(undefined)
  unpublish.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
})

/**
 * Sin autoguardado: estos tests escriben mucho con userEvent y, con la suite
 * entera en paralelo, el tipeo puede tardar más que el autoguardado real
 * (1,5 s) y colar un guardado extra. El autoguardado se prueba aparte, en
 * «autoguardado», con el delay real.
 */
function renderScreen() {
  return render(<SiteScreen autosaveDelayMs={60_000} />)
}

function statusRegion() {
  return screen.getByRole("region", { name: "Estado del sitio" })
}

async function openBlock(
  user: ReturnType<typeof userEvent.setup>,
  name: string | RegExp
) {
  await user.click(screen.getByRole("button", { name }))
}

describe("Mi sitio web", () => {
  it("sólo es para administradores", () => {
    role = "EMPLOYEE"
    renderScreen()
    expect(screen.getByText("Sólo para administradores")).toBeInTheDocument()
    expect(screen.queryByText("Estado del sitio")).toBeNull()
  })

  describe("estado", () => {
    it("Publicado", () => {
      settings = makeSettings({
        enabled: true,
        publishedAt: "2026-10-01T12:00:00.000Z",
        hasUnpublishedChanges: false,
        publicUrl: "https://oppido.sitios.test",
      })
      renderScreen()
      expect(within(statusRegion()).getByText("Publicado")).toBeInTheDocument()
      expect(
        screen.getByRole("link", { name: "https://oppido.sitios.test" })
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: "Copiar el link del sitio" })
      ).toBeInTheDocument()
      expect(
        screen.getByRole("link", { name: "Abrir el sitio en otra pestaña" })
      ).toHaveAttribute("href", "https://oppido.sitios.test")
    })

    it("Borrador con cambios", () => {
      settings = makeSettings({
        enabled: true,
        publishedAt: "2026-10-01T12:00:00.000Z",
        hasUnpublishedChanges: true,
        publicUrl: "https://oppido.sitios.test",
      })
      renderScreen()
      expect(
        within(statusRegion()).getByText("Borrador con cambios")
      ).toBeInTheDocument()
    })

    it("Sin publicar, y avisa que falta el subdominio si no hay URL", () => {
      renderScreen()
      expect(
        within(statusRegion()).getByText("Sin publicar")
      ).toBeInTheDocument()
      expect(
        within(statusRegion()).getByText(/falta elegir un subdominio/)
      ).toBeInTheDocument()
    })

    it("«Despublicar» sólo aparece con el sitio en línea", () => {
      const { unmount } = renderScreen()
      expect(screen.queryByRole("button", { name: "Despublicar" })).toBeNull()
      unmount()

      settings = makeSettings({
        enabled: true,
        publishedAt: "2026-10-01T12:00:00.000Z",
        hasUnpublishedChanges: false,
      })
      renderScreen()
      expect(
        screen.getByRole("button", { name: "Despublicar" })
      ).toBeInTheDocument()
    })
  })

  describe("guardar borrador", () => {
    it("está deshabilitado sin cambios y manda solo lo que cambió", async () => {
      renderScreen()
      const user = userEvent.setup()
      const save = screen.getByRole("button", { name: "Guardar borrador" })
      expect(save).toBeDisabled()
      expect(screen.getByText("Guardado")).toBeInTheDocument()

      // Un color del tema…
      const primary = screen.getByLabelText("Color principal")
      await user.clear(primary)
      await user.type(primary, "#000000")
      // …y un bloque de contenido.
      await user.click(screen.getByRole("tab", { name: "Contenido" }))
      await openBlock(user, /^Portada/)
      const title = screen.getByLabelText("Título")
      await user.clear(title)
      await user.type(title, "Nuevo título")

      expect(screen.getByText("Tenés cambios sin guardar")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Guardar borrador" }))

      await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
      const body = update.mock.calls[0]![0] as Record<string, unknown>
      expect(Object.keys(body).sort()).toEqual(["content", "theme"])
      expect(body.theme).toEqual({ primary: "#000000" })
      expect(Object.keys(body.content as object)).toEqual(["hero"])
      expect((body.content as { hero: { title: string } }).hero.title).toBe(
        "Nuevo título"
      )
      expect(body).not.toHaveProperty("template")
      await waitFor(() =>
        expect(screen.getByText("Guardado")).toBeInTheDocument()
      )
    })

    it("marca el contraste en vivo", async () => {
      renderScreen()
      const user = userEvent.setup()
      const item = () =>
        screen.getByText("Texto sobre fondo:").closest("li") as HTMLElement
      expect(item()).toHaveTextContent("Cumple")

      const text = screen.getByLabelText("Texto")
      await user.clear(text)
      await user.type(text, "#EEEEEE")

      expect(item()).toHaveTextContent("No cumple")
    })

    it("muestra el error 422 junto al campo y arma el resumen con los que no ubica", async () => {
      update.mockRejectedValue(
        apiFailure([
          {
            field: "content.faqs[1].answer",
            message: "La respuesta es muy larga.",
          },
          { field: "algo.raro", message: "Algo no cerró." },
        ])
      )
      renderScreen()
      const user = userEvent.setup()
      await user.click(screen.getByRole("tab", { name: "Contenido" }))
      await openBlock(user, /^Preguntas frecuentes/)
      const answer = screen.getAllByLabelText("Respuesta")[1]!
      await user.type(answer, " x")
      await user.click(screen.getByRole("button", { name: "Guardar borrador" }))

      expect(
        await screen.findByText("La respuesta es muy larga.")
      ).toBeInTheDocument()
      expect(answer).toHaveAttribute("aria-invalid", "true")
      expect(screen.getByText("Algo no cerró.")).toBeInTheDocument()
      expect(screen.getByText(/Hay 2 cosas para corregir/)).toBeInTheDocument()
      // Sigue con cambios sin guardar.
      expect(screen.getByText(/Tenés cambios sin guardar/)).toBeInTheDocument()

      // Al corregir el campo, su error se va.
      await user.type(answer, "y")
      expect(screen.queryByText("La respuesta es muy larga.")).toBeNull()
    })
  })

  describe("autoguardado", { timeout: 20_000 }, () => {
    const WAIT = { timeout: 4000 }

    async function editPrimary(
      user: ReturnType<typeof userEvent.setup>,
      value: string
    ) {
      const primary = screen.getByLabelText("Color principal")
      await user.clear(primary)
      await user.type(primary, value)
    }

    it("guarda solo, una vez, cuando se deja de escribir, y marca Guardado", async () => {
      render(<SiteScreen />)
      const user = userEvent.setup()
      await editPrimary(user, "#000000")

      // Mientras se escribe no guarda: el indicador avisa que hay cambios.
      expect(update).not.toHaveBeenCalled()
      expect(screen.getByText("Tenés cambios sin guardar")).toBeInTheDocument()

      await waitFor(() => expect(update).toHaveBeenCalledTimes(1), WAIT)
      expect(update.mock.calls[0]![0]).toEqual({
        theme: { primary: "#000000" },
      })
      await waitFor(() =>
        expect(screen.getByText("Guardado")).toBeInTheDocument()
      )
    })

    it("si falla por la red, muestra Error al guardar y no reintenta solo en bucle", async () => {
      update.mockRejectedValue(new Error("offline"))
      render(<SiteScreen />)
      const user = userEvent.setup()
      await editPrimary(user, "#000000")

      expect(
        await screen.findByText(/Error al guardar/, undefined, WAIT)
      ).toBeInTheDocument()
      // Los mismos datos no se reenvían solos.
      await new Promise((resolve) => setTimeout(resolve, 2000))
      expect(update).toHaveBeenCalledTimes(1)

      // «Reintentar» sí lo vuelve a intentar, y al salir bien queda Guardado.
      update.mockResolvedValue(undefined)
      await user.click(screen.getByRole("button", { name: "Reintentar" }))
      await waitFor(() => expect(update).toHaveBeenCalledTimes(2))
      await waitFor(() =>
        expect(screen.getByText("Guardado")).toBeInTheDocument()
      )
    })

    it("un 422 marca el campo sin cambiar de pestaña y no se vuelve a enviar lo inválido", async () => {
      update.mockRejectedValue(
        apiFailure([
          {
            field: "content.faqs[1].answer",
            message: "La respuesta es muy larga.",
          },
        ])
      )
      render(<SiteScreen />)
      const user = userEvent.setup()
      await user.click(screen.getByRole("tab", { name: "Contenido" }))
      await openBlock(user, /^Preguntas frecuentes/)
      const answer = screen.getAllByLabelText("Respuesta")[1]!
      await user.type(answer, " x")

      expect(
        await screen.findByText("La respuesta es muy larga.", undefined, WAIT)
      ).toBeInTheDocument()
      expect(answer).toHaveAttribute("aria-invalid", "true")
      // Sigue en la pestaña donde estaba escribiendo.
      expect(screen.getByRole("tab", { name: "Contenido" })).toHaveAttribute(
        "aria-selected",
        "true"
      )
      // No se guardó nada: se dice, y no hay reintentos con lo mismo.
      expect(
        screen.getByText(/corregí los campos marcados/)
      ).toBeInTheDocument()
      await new Promise((resolve) => setTimeout(resolve, 2000))
      expect(update).toHaveBeenCalledTimes(1)
      expect(screen.getByText("La respuesta es muy larga.")).toBeInTheDocument()

      // Al corregir el campo, el error se va y vuelve a guardar solo.
      update.mockResolvedValue(undefined)
      await user.type(answer, "y")
      expect(screen.queryByText("La respuesta es muy larga.")).toBeNull()
      await waitFor(() => expect(update).toHaveBeenCalledTimes(2), WAIT)
    })

    it("no pisa lo que se escribió mientras se guardaba", async () => {
      let finish: () => void = () => {}
      update.mockImplementationOnce(
        () => new Promise<void>((resolve) => (finish = resolve))
      )
      render(<SiteScreen />)
      const user = userEvent.setup()
      await editPrimary(user, "#000000")
      await waitFor(() => expect(update).toHaveBeenCalledTimes(1), WAIT)

      // Se sigue escribiendo con el primer guardado en vuelo.
      const secondary = screen.getByLabelText("Color secundario")
      await user.clear(secondary)
      await user.type(secondary, "#111111")
      finish()

      // El segundo cambio sigue pendiente (no se descartó) y se guarda después.
      await waitFor(() => expect(update).toHaveBeenCalledTimes(2), WAIT)
      expect(update.mock.calls[1]![0]).toEqual({
        theme: { primary: "#000000", secondary: "#111111" },
      })
    })
  })

  describe("publicar", () => {
    it("pide confirmación antes de publicar", async () => {
      renderScreen()
      const user = userEvent.setup()
      await user.click(screen.getByRole("button", { name: "Publicar" }))

      const dialog = await screen.findByRole("dialog")
      expect(
        within(dialog).getByText("¿Publicar el sitio?")
      ).toBeInTheDocument()
      expect(publish).not.toHaveBeenCalled()

      await user.click(within(dialog).getByRole("button", { name: "Publicar" }))
      await waitFor(() => expect(publish).toHaveBeenCalledTimes(1))
      expect(update).not.toHaveBeenCalled()
    })

    it("con cambios sin guardar, los guarda primero", async () => {
      renderScreen()
      const user = userEvent.setup()
      const primary = screen.getByLabelText("Color principal")
      await user.clear(primary)
      await user.type(primary, "#000000")

      await user.click(screen.getByRole("button", { name: "Publicar" }))
      const dialog = await screen.findByRole("dialog")
      expect(
        within(dialog).getByText(/los guardamos antes de publicar/)
      ).toBeInTheDocument()
      await user.click(within(dialog).getByRole("button", { name: "Publicar" }))

      await waitFor(() => expect(publish).toHaveBeenCalled())
      expect(update).toHaveBeenCalledWith({ theme: { primary: "#000000" } })
      expect(update.mock.invocationCallOrder[0]).toBeLessThan(
        publish.mock.invocationCallOrder[0]!
      )
    })

    it("si la API devuelve 422, lista los problemas", async () => {
      publish.mockRejectedValue(
        apiFailure([
          {
            field: "content.seo.title",
            message: "Completá el título para buscadores.",
          },
          {
            field: "content.sections",
            message: "La sección Nosotros está vacía.",
          },
        ])
      )
      renderScreen()
      const user = userEvent.setup()
      await user.click(screen.getByRole("button", { name: "Publicar" }))
      const dialog = await screen.findByRole("dialog")
      await user.click(within(dialog).getByRole("button", { name: "Publicar" }))

      expect(
        await within(dialog).findByText("No pudimos publicar")
      ).toBeInTheDocument()
      expect(
        within(dialog).getByText("Completá el título para buscadores.")
      ).toBeInTheDocument()
      expect(
        within(dialog).getByText("La sección Nosotros está vacía.")
      ).toBeInTheDocument()
      await user.click(
        within(dialog).getByRole("button", { name: "Entendido" })
      )
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    })
  })

  it("despublicar pide confirmación", async () => {
    settings = makeSettings({
      enabled: true,
      publishedAt: "2026-10-01T12:00:00.000Z",
      hasUnpublishedChanges: false,
    })
    renderScreen()
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Despublicar" }))
    const dialog = await screen.findByRole("dialog")
    expect(unpublish).not.toHaveBeenCalled()
    await user.click(
      within(dialog).getByRole("button", { name: "Despublicar" })
    )
    await waitFor(() => expect(unpublish).toHaveBeenCalledTimes(1))
  })

  describe("template", () => {
    it("pregunta por el tema y, si se acepta, lo restaura conservando el contenido", async () => {
      renderScreen()
      const user = userEvent.setup()
      await user.click(screen.getByRole("radio", { name: /Moderno/ }))

      const dialog = await screen.findByRole("dialog")
      expect(
        within(dialog).getByText(/restaurar los colores, la tipografía/)
      ).toBeInTheDocument()
      expect(update).not.toHaveBeenCalled()
      await user.click(
        within(dialog).getByRole("button", {
          name: "Restaurar el tema del template",
        })
      )

      await waitFor(() =>
        expect(reset).toHaveBeenCalledWith({ keepContent: true })
      )
      expect(update).toHaveBeenCalledWith({ template: "MODERN" })
    })

    it("si se conserva el tema, no restaura", async () => {
      renderScreen()
      const user = userEvent.setup()
      await user.click(screen.getByRole("radio", { name: /Moderno/ }))
      const dialog = await screen.findByRole("dialog")
      await user.click(
        within(dialog).getByRole("button", { name: "Conservar mi tema" })
      )
      await waitFor(() =>
        expect(update).toHaveBeenCalledWith({ template: "MODERN" })
      )
      expect(reset).not.toHaveBeenCalled()
    })

    it("cancelar no cambia nada", async () => {
      renderScreen()
      const user = userEvent.setup()
      await user.click(screen.getByRole("radio", { name: /Moderno/ }))
      const dialog = await screen.findByRole("dialog")
      await user.click(within(dialog).getByRole("button", { name: "Cancelar" }))
      expect(update).not.toHaveBeenCalled()
      expect(reset).not.toHaveBeenCalled()
    })

    it("cada template muestra su miniatura real", () => {
      renderScreen()
      expect(
        screen.getByAltText("Vista de ejemplo del template Clásico")
      ).toHaveAttribute("src", "/templates/classic.png")
      expect(screen.getByRole("radio", { name: /Clásico/ })).toHaveAttribute(
        "aria-checked",
        "true"
      )
    })
  })

  describe("preguntas frecuentes", () => {
    async function openFaqs(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole("tab", { name: "Contenido" }))
      await openBlock(user, /^Preguntas frecuentes/)
    }
    const questions = () =>
      screen
        .getAllByLabelText("Pregunta", { selector: "input" })
        .map((input) => (input as HTMLInputElement).value)

    it("agrega, mueve y quita", async () => {
      renderScreen()
      const user = userEvent.setup()
      await openFaqs(user)
      expect(questions()).toEqual(["¿Cómo alquilo?", "¿Cuánto cuesta?"])
      expect(screen.getByText("2 de 20")).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Agregar pregunta" }))
      expect(questions()).toEqual(["¿Cómo alquilo?", "¿Cuánto cuesta?", ""])
      expect(screen.getByText("3 de 20")).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Bajar pregunta 1" }))
      expect(questions()).toEqual(["¿Cuánto cuesta?", "¿Cómo alquilo?", ""])

      await user.click(screen.getByRole("button", { name: "Subir pregunta 3" }))
      expect(questions()).toEqual(["¿Cuánto cuesta?", "", "¿Cómo alquilo?"])

      await user.click(
        screen.getByRole("button", { name: "Quitar pregunta 2" })
      )
      expect(questions()).toEqual(["¿Cuánto cuesta?", "¿Cómo alquilo?"])

      // Todo eso se manda como el bloque entero.
      await user.click(screen.getByRole("button", { name: "Guardar borrador" }))
      await waitFor(() => expect(update).toHaveBeenCalled())
      expect(update).toHaveBeenCalledWith({
        content: {
          faqs: [
            { question: "¿Cuánto cuesta?", answer: "Depende." },
            { question: "¿Cómo alquilo?", answer: "Escribinos." },
          ],
        },
      })
    })

    it("no deja subir el primero ni bajar el último, y respeta el máximo", async () => {
      settings = makeSettings()
      settings.draft.content.faqs = Array.from({ length: 20 }, (_, i) => ({
        question: `P${i}`,
        answer: "R",
      }))
      renderScreen()
      const user = userEvent.setup()
      await openFaqs(user)
      expect(
        screen.getByRole("button", { name: "Subir pregunta 1" })
      ).toBeDisabled()
      expect(
        screen.getByRole("button", { name: "Bajar pregunta 20" })
      ).toBeDisabled()
      expect(
        screen.getByRole("button", { name: "Agregar pregunta" })
      ).toBeDisabled()
      expect(screen.getByText("20 de 20")).toBeInTheDocument()
    })

    it("muestra el contador de caracteres", async () => {
      renderScreen()
      const user = userEvent.setup()
      await openFaqs(user)
      // "¿Cómo alquilo?" tiene 14 caracteres, de 200.
      expect(screen.getByText("14/200")).toBeInTheDocument()
    })
  })

  it("las secciones se reordenan y se ocultan", async () => {
    renderScreen()
    const user = userEvent.setup()
    await user.click(screen.getByRole("tab", { name: "Secciones" }))

    await user.click(screen.getByRole("button", { name: "Bajar Portada" }))
    await user.click(
      screen.getByRole("switch", { name: "Mostrar Preguntas frecuentes" })
    )
    await user.click(screen.getByRole("button", { name: "Guardar borrador" }))

    await waitFor(() => expect(update).toHaveBeenCalled())
    expect(update).toHaveBeenCalledWith({
      content: {
        sections: [
          { key: "faqs", visible: true },
          { key: "hero", visible: true },
          { key: "contact", visible: true },
        ],
      },
    })
  })

  it("al tocar un link con cambios sin guardar, pide confirmación", async () => {
    render(
      <>
        <a href="/propiedades">Propiedades</a>
        <SiteScreen />
      </>
    )
    const user = userEvent.setup()

    // Sin cambios, navega normal (sin diálogo).
    await user.click(screen.getByRole("link", { name: "Propiedades" }))
    expect(screen.queryByText("¿Salir sin guardar?")).toBeNull()

    const primary = screen.getByLabelText("Color principal")
    await user.clear(primary)
    await user.type(primary, "#000000")
    await user.click(screen.getByRole("link", { name: "Propiedades" }))

    expect(await screen.findByText("¿Salir sin guardar?")).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Salir sin guardar" }))
    expect(push).toHaveBeenCalledWith("/propiedades")
  })

  it("avisa con beforeunload sólo cuando hay cambios", async () => {
    renderScreen()
    const user = userEvent.setup()
    const fire = () => {
      const event = new Event("beforeunload", { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(fire()).toBe(false)
    const primary = screen.getByLabelText("Color principal")
    await user.clear(primary)
    await user.type(primary, "#000000")
    expect(fire()).toBe(true)
  })

  it("la vista previa arma el iframe con el slug y el token", async () => {
    renderScreen()
    const user = userEvent.setup()
    await user.click(screen.getByRole("tab", { name: "Vista previa" }))
    const frame = await screen.findByTitle(/Vista previa del sitio/)
    expect(frame).toHaveAttribute(
      "src",
      "http://localhost:3003/_s/oppido?preview=tok-123"
    )
    await user.click(screen.getByRole("radio", { name: /Escritorio/ }))
    expect(screen.getByTitle(/escritorio, 1280 px/)).toBeInTheDocument()
  })

  it("el dominio se guarda con su propio botón, fuera del borrador", async () => {
    renderScreen()
    const user = userEvent.setup()
    await user.click(screen.getByRole("tab", { name: "Dominio" }))
    await user.type(
      screen.getByLabelText("Nombre del dominio"),
      "www.oppido.com.ar"
    )
    await user.click(screen.getByRole("button", { name: "Guardar dominio" }))
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ customDomain: "www.oppido.com.ar" })
    )
    // No ensució el borrador.
    expect(screen.getByText("Guardado")).toBeInTheDocument()
  })

  it("los textos del editor son texto plano (no se interpreta HTML)", async () => {
    settings = makeSettings()
    settings.draft.content.hero.title = "<img src=x onerror=alert(1)>"
    const { container } = renderScreen()
    const user = userEvent.setup()
    await user.click(screen.getByRole("tab", { name: "Contenido" }))
    await openBlock(user, /^Portada/)
    expect(screen.getByLabelText("Título")).toHaveValue(
      "<img src=x onerror=alert(1)>"
    )
    expect(container.querySelector("img[src='x']")).toBeNull()
  })

  describe("verificación del dominio propio", () => {
    const pending = (): SiteDomain => ({
      customDomain: "www.oppido.com.ar",
      verified: false,
      verifiedAt: null,
      verificationRequired: true,
      record: {
        type: "TXT",
        host: "_adminprop-verify.www.oppido.com.ar",
        value: "adminprop-verify=0123456789abcdef0123456789abcdef",
      },
    })

    async function openDomainTab() {
      const user = userEvent.setup()
      renderScreen()
      await user.click(screen.getByRole("tab", { name: "Dominio" }))
      return user
    }

    it("sin dominio cargado explica que se pide un registro para demostrar que es tuyo", async () => {
      await openDomainTab()
      expect(
        screen.getByText(/cargá tu dominio y te damos un registro dns/i)
      ).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: "Verificar dominio" })
      ).toBeNull()
    })

    it("un dominio sin verificar muestra el registro TXT y que el sitio todavía no responde ahí", async () => {
      settings = makeSettings()
      settings.customDomain = "www.oppido.com.ar"
      domainState = pending()
      await openDomainTab()

      expect(
        screen.getByText(/falta verificar www\.oppido\.com\.ar/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText("_adminprop-verify.www.oppido.com.ar")
      ).toBeInTheDocument()
      expect(
        screen.getByText("adminprop-verify=0123456789abcdef0123456789abcdef")
      ).toBeInTheDocument()
      expect(
        screen.getByText(/el sitio\s+no responde ahí/i)
      ).toBeInTheDocument()
    })

    it("verifica con el botón y, si el TXT todavía no está, muestra el aviso de la API", async () => {
      settings = makeSettings()
      settings.customDomain = "www.oppido.com.ar"
      domainState = pending()
      verifyDomain.mockRejectedValueOnce(
        new AxiosError("422", "ERR", undefined, undefined, {
          status: 422,
          statusText: "",
          headers: {},
          config: {} as never,
          data: {
            code: "DOMAIN_NOT_VERIFIED",
            message:
              "Todavía no encontramos el registro TXT en _adminprop-verify.www.oppido.com.ar.",
          },
        })
      )
      const user = await openDomainTab()

      await user.click(
        screen.getByRole("button", { name: "Verificar dominio" })
      )

      expect(
        await screen.findByText(/todavía no encontramos el registro txt/i)
      ).toBeInTheDocument()
      expect(verifyDomain).toHaveBeenCalledTimes(1)
    })

    it("un dominio verificado se muestra como tal, sin pedir el registro", async () => {
      settings = makeSettings()
      settings.customDomain = "www.oppido.com.ar"
      domainState = {
        ...pending(),
        verified: true,
        verifiedAt: "2026-11-03T12:00:00Z",
      }
      await openDomainTab()

      expect(screen.getByText(/está verificado\./i)).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: "Verificar dominio" })
      ).toBeNull()
    })

    it("no deja verificar mientras hay un dominio escrito sin guardar", async () => {
      settings = makeSettings()
      settings.customDomain = "www.oppido.com.ar"
      domainState = pending()
      const user = await openDomainTab()

      await user.type(screen.getByLabelText("Nombre del dominio"), "x")

      expect(
        screen.getByRole("button", { name: "Verificar dominio" })
      ).toBeDisabled()
      expect(screen.getByText(/primero guardá el dominio/i)).toBeInTheDocument()
    })
  })
})
