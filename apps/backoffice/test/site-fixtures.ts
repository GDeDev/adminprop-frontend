import type {
  SiteSettings,
  SiteSettingsDraft,
  SiteTemplateInfo,
} from "@adminprop/shared-types"

export function makeDraft(): SiteSettingsDraft {
  return {
    template: "CLASSIC",
    theme: {
      primary: "#B45309",
      secondary: "#1F2937",
      background: "#FFFFFF",
      surface: "#F3F4F6",
      text: "#111827",
      fontKey: "system",
      radius: 8,
    },
    content: {
      brand: {
        displayName: "Oppido",
        tagline: null,
        logoUrl: null,
        faviconUrl: null,
      },
      contact: {
        address: null,
        hours: null,
        phone: null,
        whatsapp: null,
        whatsappMessage: null,
        email: null,
        socials: [],
      },
      hero: {
        title: "Tu próximo hogar",
        subtitle: null,
        ctaLabel: null,
        backgroundImageUrl: null,
        showSearch: true,
      },
      steps: [],
      featured: {
        title: "Destacadas",
        subtitle: null,
        count: 6,
        mode: "LATEST",
        propertyIds: [],
      },
      metrics: [],
      services: [],
      testimonials: [],
      faqs: [
        { question: "¿Cómo alquilo?", answer: "Escribinos." },
        { question: "¿Cuánto cuesta?", answer: "Depende." },
      ],
      about: { title: "Nosotros", body: null, imageUrl: null },
      seo: { title: "", description: "", ogImageUrl: null },
      sections: [
        { key: "hero", visible: true },
        { key: "faqs", visible: false },
        { key: "contact", visible: true },
      ],
    },
  }
}

export function makeSettings(
  overrides: Partial<SiteSettings> = {}
): SiteSettings {
  return {
    enabled: false,
    subdomain: null,
    customDomain: null,
    draft: makeDraft(),
    publishedAt: null,
    hasUnpublishedChanges: true,
    publicUrl: null,
    ...overrides,
  }
}

export function makeTemplates(): SiteTemplateInfo[] {
  const classic = makeDraft().theme
  return [
    {
      key: "CLASSIC",
      name: "Clásico",
      description: "Oscuro y cálido, con hero a pantalla completa.",
      previewImageUrl: null,
      defaultTheme: classic,
      supportedSections: ["hero", "faqs", "contact"],
      fontOptions: [
        { key: "system", label: "Sistema" },
        { key: "serif", label: "Con serif" },
      ],
    },
    {
      key: "MODERN",
      name: "Moderno",
      description: "Claro y limpio, muy legible en el celular.",
      previewImageUrl: null,
      defaultTheme: {
        ...classic,
        primary: "#0F766E",
        radius: 16,
        fontKey: "humanist",
      },
      supportedSections: ["hero", "faqs", "contact"],
      fontOptions: [
        { key: "humanist", label: "Humanista" },
        { key: "rounded", label: "Redondeada" },
      ],
    },
  ]
}
