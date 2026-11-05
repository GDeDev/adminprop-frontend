import type { TemplateKit } from "../types"
import { LuxuryPropertyCard } from "./card"
import { LuxuryFooter, LuxuryHeader } from "./chrome"
import { LuxuryHero } from "./hero"
import { LuxuryPageTitle } from "./page-title"
import {
  LuxuryAbout,
  LuxuryContactSection,
  LuxuryFaqs,
  LuxuryFeatured,
  LuxuryMetrics,
  LuxuryServices,
  LuxurySteps,
  LuxuryTestimonials,
} from "./sections"

export const luxuryKit: TemplateKit = {
  Header: LuxuryHeader,
  Footer: LuxuryFooter,
  PropertyCard: LuxuryPropertyCard,
  PageTitle: LuxuryPageTitle,
  sections: {
    hero: LuxuryHero,
    steps: LuxurySteps,
    featured: LuxuryFeatured,
    metrics: LuxuryMetrics,
    services: LuxuryServices,
    testimonials: LuxuryTestimonials,
    faqs: LuxuryFaqs,
    about: LuxuryAbout,
    contact: LuxuryContactSection,
  },
}
