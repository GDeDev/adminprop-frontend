import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react"
import type { ReactNode } from "react"

import { ContactForm } from "@/components/contact-form"
import { serviceIcon, SocialLink, StepIcon } from "@/components/icons"
import { Reveal } from "@/components/reveal"
import { SiteImage } from "@/components/site-image"
import { cn } from "@/lib/cn"
import { basePath, hrefFor } from "@/lib/site-route"
import { telLink, whatsappLink } from "@/lib/whatsapp"

import { ModernPropertyCard } from "./card"
import type { SectionProps } from "../types"

/** Contenedor de sección de MODERN: títulos grandes alineados a la izquierda. */
function Block({
  id,
  title,
  subtitle,
  tone = "bg",
  className,
  children,
}: {
  id: string
  title?: string
  subtitle?: string | null
  tone?: "bg" | "surface"
  className?: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={title ? `${id}-title` : undefined}
      className={cn(
        "py-16 md:py-24",
        tone === "surface" && "bg-site-surface",
        className
      )}
    >
      <Reveal className="mx-auto max-w-6xl px-4">
        {title && (
          <header className="mb-10 max-w-2xl">
            <h2
              id={`${id}-title`}
              className="text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-site-muted mt-3 text-lg">{subtitle}</p>
            )}
          </header>
        )}
        {children}
      </Reveal>
    </section>
  )
}

export function ModernSteps({ site }: SectionProps) {
  const { steps } = site.content
  if (steps.length === 0) return null
  return (
    <Block id="steps" className="pt-24 md:pt-32">
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={`${step.title}-${i}`}>
            <div className="flex items-center gap-4">
              <span className="bg-site-primary text-site-on-primary flex size-12 items-center justify-center rounded-full">
                <StepIcon name={step.icon} className="size-6" />
              </span>
              <span
                aria-hidden
                className="text-site-muted/60 text-4xl font-semibold"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold">{step.title}</h2>
            <p className="text-site-muted mt-2">{step.description}</p>
          </li>
        ))}
      </ol>
    </Block>
  )
}

export function ModernFeatured(props: SectionProps) {
  const { site, route, featured } = props
  const { title, subtitle } = site.content.featured
  return (
    <Block id="featured" title={title} subtitle={subtitle} tone="surface">
      {featured.length === 0 ? (
        <p className="text-site-muted">
          Estamos cargando nuevas propiedades. Volvé a visitarnos pronto.
        </p>
      ) : (
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((property) => (
            <li key={property.id}>
              <ModernPropertyCard
                site={site}
                route={route}
                property={property}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-12">
        <a
          href={hrefFor(route, "/propiedades")}
          className="bg-site-text text-site-bg inline-flex min-h-12 items-center gap-2 rounded-full px-7 font-semibold"
        >
          Ver todas las propiedades
          <ArrowRight aria-hidden className="size-4" />
        </a>
      </p>
    </Block>
  )
}

export function ModernMetrics({ site }: SectionProps) {
  const { metrics } = site.content
  if (metrics.length === 0) return null
  return (
    <Block id="metrics" title="Nosotros en números">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <div
            key={`${metric.label}-${i}`}
            className="rounded-site bg-site-surface p-6"
          >
            <dd className="order-first text-4xl font-semibold tracking-tight md:text-5xl">
              {metric.value}
            </dd>
            <dt className="text-site-muted mt-2">{metric.label}</dt>
          </div>
        ))}
      </dl>
    </Block>
  )
}

export function ModernServices({ site }: SectionProps) {
  const { services } = site.content
  if (services.length === 0) return null
  return (
    <Block id="services" title="Nuestros servicios" tone="surface">
      <ul className="grid gap-6 md:grid-cols-3">
        {services.map((service, i) => (
          <li
            key={`${service.title}-${i}`}
            className="rounded-site bg-site-bg overflow-hidden"
          >
            <div className="bg-site-surface aspect-[16/10]">
              {service.imageUrl ? (
                <SiteImage
                  src={service.imageUrl}
                  alt={service.title}
                  width={640}
                  height={400}
                  className="size-full object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="text-site-on-primary flex size-full items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--site-primary), color-mix(in srgb, var(--site-primary) 60%, var(--site-text)))",
                  }}
                >
                  <StepIcon name={serviceIcon(i)} className="size-14" />
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p className="text-site-muted mt-2 whitespace-pre-line">
                {service.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Block>
  )
}

export function ModernTestimonials({ site }: SectionProps) {
  const { testimonials } = site.content
  if (testimonials.length === 0) return null
  return (
    <Block id="testimonials" title="Lo que dicen nuestros clientes">
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <li key={`${t.name}-${i}`}>
            <figure className="rounded-site bg-site-surface flex h-full flex-col p-6">
              <blockquote className="flex-1 text-lg whitespace-pre-line">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {t.photoUrl && (
                  <SiteImage
                    src={t.photoUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 rounded-full object-cover"
                  />
                )}
                <span>
                  <span className="block font-semibold">{t.name}</span>
                  {t.role && (
                    <span className="text-site-muted block text-sm">
                      {t.role}
                    </span>
                  )}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Block>
  )
}

export function ModernFaqs({ site }: SectionProps) {
  const { faqs } = site.content
  if (faqs.length === 0) return null
  return (
    <Block id="faqs" tone="surface">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <h2
          id="faqs-title"
          className="text-3xl font-semibold tracking-tight md:text-4xl"
        >
          Preguntas frecuentes
        </h2>
        <div className="divide-site-border border-site-border divide-y border-y">
          {faqs.map((faq, i) => (
            <details key={`${faq.question}-${i}`} className="group">
              <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3 text-lg font-medium">
                {faq.question}
                <span
                  aria-hidden
                  className="bg-site-bg flex size-8 shrink-0 items-center justify-center rounded-full text-xl transition-transform group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="text-site-muted pb-5 whitespace-pre-line">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Block>
  )
}

export function ModernAbout({ site }: SectionProps) {
  const { about } = site.content
  if (!about.body) return null
  return (
    <Block id="about">
      <div
        className={cn(
          "grid items-center gap-10",
          about.imageUrl && "md:grid-cols-2"
        )}
      >
        <div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {about.title}
          </h2>
          <p className="text-site-muted mt-5 text-lg whitespace-pre-line">
            {about.body}
          </p>
        </div>
        {about.imageUrl && (
          <SiteImage
            src={about.imageUrl}
            alt={about.title}
            width={800}
            height={600}
            className="rounded-site aspect-[4/3] w-full object-cover"
          />
        )}
      </div>
    </Block>
  )
}

export function ModernContactSection({ site, route }: SectionProps) {
  const { contact } = site.content
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage)
  const tel = telLink(contact.phone)
  return (
    <Block id="contact" className="pb-8">
      <div className="rounded-site bg-site-surface grid gap-10 p-6 md:p-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2
            id="contact-title"
            className="text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Hablemos
          </h2>
          <p className="text-site-muted mt-3">
            Contanos qué estás buscando y te respondemos a la brevedad.
          </p>
          <ul className="mt-6 space-y-3">
            {contact.address && (
              <li className="flex items-start gap-3">
                <MapPin aria-hidden className="mt-1 size-5 shrink-0" />
                {contact.address}
              </li>
            )}
            {contact.hours && (
              <li className="flex items-start gap-3">
                <Clock aria-hidden className="mt-1 size-5 shrink-0" />
                {contact.hours}
              </li>
            )}
            {tel && (
              <li className="flex items-center gap-3">
                <Phone aria-hidden className="size-5 shrink-0" />
                <a
                  href={tel}
                  className="inline-flex min-h-11 items-center hover:underline"
                >
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.email && (
              <li className="flex items-center gap-3">
                <Mail aria-hidden className="size-5 shrink-0" />
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex min-h-11 items-center break-all hover:underline"
                >
                  {contact.email}
                </a>
              </li>
            )}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-site-text text-site-bg inline-flex min-h-11 items-center rounded-full px-5 font-semibold"
              >
                Escribinos por WhatsApp
              </a>
            )}
            {contact.socials.map((s) => (
              <SocialLink
                key={s.network}
                network={s.network}
                url={s.url}
                className="bg-site-bg hover:bg-site-primary hover:text-site-on-primary inline-flex size-11 items-center justify-center rounded-full"
              />
            ))}
          </div>
        </div>
        <ContactForm
          base={basePath(route)}
          disabled={route.previewToken !== null}
          className="rounded-site bg-site-bg p-6"
        />
      </div>
    </Block>
  )
}
