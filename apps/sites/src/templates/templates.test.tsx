import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FILTERS, makeSite, PROPERTY, ROUTE } from "@/test-fixtures"

import { templateKit } from "."

const KEYS = ["CLASSIC", "MODERN"] as const
const SECTION_KEYS = [
  "hero",
  "steps",
  "featured",
  "metrics",
  "services",
  "testimonials",
  "faqs",
  "about",
  "contact",
] as const

describe.each(KEYS)("template %s", (key) => {
  const kit = templateKit(key)
  const props = (site = makeSite(key)) => ({
    site,
    route: ROUTE,
    featured: [PROPERTY],
    filters: FILTERS,
  })

  it("tiene un componente para cada una de las secciones del contrato", () => {
    for (const section of SECTION_KEYS) {
      expect(kit.sections[section]).toBeTypeOf("function")
    }
  })

  it("el hero muestra título, CTA a WhatsApp y el buscador", () => {
    const Hero = kit.sections.hero
    render(<Hero {...props()} />)
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /propiedades a tu medida/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /contactanos hoy/i })
    ).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5492215550101")
    )
    expect(
      screen.getByRole("search", { name: /buscar propiedades/i })
    ).toBeInTheDocument()
  })

  it("el hero sin buscador ni WhatsApp no los muestra", () => {
    const site = makeSite(key)
    site.content.hero.showSearch = false
    site.content.contact.whatsapp = null
    const Hero = kit.sections.hero
    render(<Hero {...props(site)} />)
    expect(screen.queryByRole("search")).toBeNull()
    expect(screen.queryByRole("link", { name: /contactanos hoy/i })).toBeNull()
  })

  it("las destacadas enlazan a la ficha con el prefijo del sitio y muestran el precio", () => {
    const Featured = kit.sections.featured
    render(<Featured {...props()} />)
    const link = screen.getByRole("link", { name: /calle 7 1234/i })
    expect(link).toHaveAttribute("href", `/_s/demo/propiedades/${PROPERTY.id}`)
    expect(within(link).getByText("$ 420.000")).toBeInTheDocument()
  })

  it("una propiedad sin precio dice 'Precio a consultar' en chico, no 'Consultar' como un título", () => {
    const Featured = kit.sections.featured
    render(
      <Featured
        {...props()}
        featured={[{ ...PROPERTY, price: null, currency: null }]}
      />
    )
    expect(screen.getByText("Precio a consultar")).toBeInTheDocument()
    expect(screen.queryByText("Consultar")).toBeNull()
    expect(screen.queryByText("$ 420.000")).toBeNull()
  })

  it("sin propiedades las destacadas muestran un estado vacío", () => {
    const Featured = kit.sections.featured
    render(<Featured {...props()} featured={[]} />)
    expect(
      screen.getByText(/estamos cargando nuevas propiedades/i)
    ).toBeInTheDocument()
  })

  it("las secciones de listas se ocultan solas si no tienen contenido", () => {
    const site = makeSite(key)
    site.content.metrics = []
    site.content.testimonials = []
    site.content.faqs = []
    site.content.steps = []
    site.content.services = []
    site.content.about.body = null
    const { container } = render(
      <>
        {(
          [
            "metrics",
            "testimonials",
            "faqs",
            "steps",
            "services",
            "about",
          ] as const
        ).map((section) => {
          const Section = kit.sections[section]
          return <Section key={section} {...props(site)} />
        })}
      </>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("las preguntas frecuentes son un acordeón nativo accesible", () => {
    const Faqs = kit.sections.faqs
    render(<Faqs {...props()} />)
    expect(screen.getByText("¿Qué necesito?").closest("details")).not.toBeNull()
  })

  it("nunca interpreta como HTML lo que escribe la inmobiliaria", () => {
    const attack = '<img src=x onerror="alert(1)"><script>alert(2)</script>'
    const site = makeSite(key)
    site.content.hero.title = attack
    site.content.faqs = [{ question: attack, answer: attack }]
    site.content.testimonials = [
      { name: attack, text: attack, role: attack, photoUrl: null },
    ]
    site.content.about.body = attack
    const { container } = render(
      <>
        {(["hero", "faqs", "testimonials", "about"] as const).map((section) => {
          const Section = kit.sections[section]
          return <Section key={section} {...props(site)} />
        })}
      </>
    )
    expect(container.querySelector("script")).toBeNull()
    expect(container.querySelector("img[onerror]")).toBeNull()
    expect(container.textContent).toContain("<script>alert(2)</script>")
  })

  it("el contacto lleva el formulario con honeypot, y deshabilitado en la vista previa", () => {
    const Contact = kit.sections.contact
    const { rerender } = render(<Contact {...props()} />)
    const form = screen.getByRole("form", { name: /formulario de contacto/i })
    expect(form.querySelector('input[name="website"]')).not.toBeNull()
    expect(
      screen.getByRole("button", { name: /enviar consulta/i })
    ).toBeEnabled()

    rerender(
      <Contact
        {...props()}
        route={{ ...ROUTE, previewToken: "t".repeat(30) }}
      />
    )
    expect(
      screen.getByRole("button", { name: /enviar consulta/i })
    ).toBeDisabled()
  })

  it("el header muestra 'Nosotros' solo si la sección es visible", () => {
    const { rerender } = render(
      <kit.Header site={makeSite(key)} route={ROUTE} />
    )
    expect(
      screen.getAllByRole("link", { name: "Nosotros" }).length
    ).toBeGreaterThan(0)

    const hidden = makeSite(key)
    hidden.content.sections = hidden.content.sections.map((s) =>
      s.key === "about" ? { ...s, visible: false } : s
    )
    rerender(<kit.Header site={hidden} route={ROUTE} />)
    expect(screen.queryByRole("link", { name: "Nosotros" })).toBeNull()
  })
})
