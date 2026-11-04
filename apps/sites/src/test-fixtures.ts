import type {
  PublicFilters,
  PublicPropertySummary,
  PublicSite,
} from "@adminprop/shared-types"

import type { SiteRoute } from "@/lib/site-route"

export const ROUTE: SiteRoute = {
  mode: "dev",
  slug: "demo",
  previewToken: null,
}

export const PROPERTY: PublicPropertySummary = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Calle 7 1234",
  address: "Calle 7 1234, 2° A",
  propertyType: "Departamento",
  neighborhood: "Centro",
  bedrooms: 2,
  bathrooms: 1,
  areaM2: 62,
  price: "420000.00",
  currency: "ARS",
  coverPhotoUrl: null,
  amenities: [],
  operation: "RENT",
  rooms: 3,
  coveredAreaM2: 58,
  ageYears: 8,
}

export const FILTERS: PublicFilters = {
  propertyTypes: [{ id: "t1", name: "Casa" }],
  locations: [{ id: "l1", name: "Centro, La Plata" }],
}

export function makeSite(
  template: "CLASSIC" | "MODERN" | "LUXURY" = "CLASSIC"
): PublicSite {
  return {
    template,
    theme: {
      primary: "#B6A28E",
      secondary: "#5F6F65",
      background: "#181C14",
      surface: "#3C3D37",
      text: "#F4F1EC",
      fontKey: "system",
      radius: 8,
    },
    tenant: { slug: "demo", name: "Demo Inmobiliaria", logoUrl: null },
    publishedAt: "2026-11-03T12:00:00.000Z",
    content: {
      brand: {
        displayName: "Demo Inmobiliaria",
        tagline: "Tu próxima casa",
        logoUrl: null,
        faviconUrl: null,
      },
      contact: {
        address: "Calle 12 n° 845",
        hours: "Lun a Vie 9 a 18",
        phone: "221 555 0101",
        whatsapp: "5492215550101",
        whatsappMessage: "Hola",
        email: "info@demo.test",
        socials: [{ network: "INSTAGRAM", url: "https://instagram.com/demo" }],
      },
      hero: {
        title: "Propiedades a tu medida.",
        subtitle: "Descubrí las mejores oportunidades.",
        ctaLabel: "Contactanos hoy",
        backgroundImageUrl: null,
        showSearch: true,
      },
      steps: [{ title: "Buscá", description: "Explorá.", icon: "search" }],
      featured: {
        title: "Propiedades destacadas",
        subtitle: null,
        count: 6,
        mode: "LATEST",
        propertyIds: [],
      },
      metrics: [{ value: "20+", label: "Años" }],
      services: [
        { title: "Alquiler", description: "Te ayudamos.", imageUrl: null },
      ],
      testimonials: [
        { name: "Ana", text: "Excelente", role: "Inquilina", photoUrl: null },
      ],
      faqs: [{ question: "¿Qué necesito?", answer: "Tus datos." }],
      about: {
        title: "Sobre nosotros",
        body: "Somos una inmobiliaria.",
        imageUrl: null,
      },
      seo: { title: "Demo", description: "Demo", ogImageUrl: null },
      sections: [
        { key: "hero", visible: true },
        { key: "steps", visible: true },
        { key: "featured", visible: true },
        { key: "metrics", visible: true },
        { key: "services", visible: true },
        { key: "testimonials", visible: true },
        { key: "faqs", visible: true },
        { key: "about", visible: true },
        { key: "contact", visible: true },
      ],
    },
  }
}
