import type { TemplateKit } from "../types"
import { ModernPropertyCard } from "./card"
import { ModernFooter, ModernHeader } from "./chrome"
import { ModernHero } from "./hero"
import { ModernPageTitle } from "./page-title"
import {
  ModernAbout,
  ModernContactSection,
  ModernFaqs,
  ModernFeatured,
  ModernMetrics,
  ModernServices,
  ModernSteps,
  ModernTestimonials,
} from "./sections"

export const modernKit: TemplateKit = {
  Header: ModernHeader,
  Footer: ModernFooter,
  PropertyCard: ModernPropertyCard,
  PageTitle: ModernPageTitle,
  sections: {
    hero: ModernHero,
    steps: ModernSteps,
    featured: ModernFeatured,
    metrics: ModernMetrics,
    services: ModernServices,
    testimonials: ModernTestimonials,
    faqs: ModernFaqs,
    about: ModernAbout,
    contact: ModernContactSection,
  },
}
