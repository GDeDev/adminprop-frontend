import type { TemplateKit } from "../types"
import { ClassicPropertyCard } from "./card"
import { ClassicFooter, ClassicHeader } from "./chrome"
import { ClassicHero } from "./hero"
import { ClassicPageTitle } from "./page-title"
import {
  ClassicAbout,
  ClassicContactSection,
  ClassicFaqs,
  ClassicFeatured,
  ClassicMetrics,
  ClassicServices,
  ClassicSteps,
  ClassicTestimonials,
} from "./sections"

export const classicKit: TemplateKit = {
  Header: ClassicHeader,
  Footer: ClassicFooter,
  PropertyCard: ClassicPropertyCard,
  PageTitle: ClassicPageTitle,
  sections: {
    hero: ClassicHero,
    steps: ClassicSteps,
    featured: ClassicFeatured,
    metrics: ClassicMetrics,
    services: ClassicServices,
    testimonials: ClassicTestimonials,
    faqs: ClassicFaqs,
    about: ClassicAbout,
    contact: ClassicContactSection,
  },
}
