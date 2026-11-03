import { ArrowRight, Clock, Mail, MapPin, Phone, Quote } from "lucide-react"
import type { ReactNode } from "react"

import { ContactForm } from "@/components/contact-form"
import { serviceIcon, SocialLink, StepIcon } from "@/components/icons"
import { Reveal } from "@/components/reveal"
import { SiteImage } from "@/components/site-image"
import { cn } from "@/lib/cn"
import { basePath, hrefFor } from "@/lib/site-route"
import { telLink, whatsappLink } from "@/lib/whatsapp"

import { ClassicPropertyCard } from "./card"
import type { SectionProps } from "../types"

/** Contenedor y encabezado de sección de CLASSIC: títulos en mayúsculas, centrados. */
function Block({
  id,
  title,
  subtitle,
  tone = "bg",
  children,
}: {
  id: string
  title?: string
  subtitle?: string | null
  tone?: "bg" | "surface"
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={title ? `${id}-title` : undefined}
      className={cn(
        "py-16 md:py-20",
        tone === "surface" && "border-site-border bg-site-surface border-y"
      )}
    >
      <Reveal className="mx-auto max-w-6xl px-4">
        {title && (
          <header className="mx-auto mb-10 max-w-2xl text-center">
            <h2
              id={`${id}-title`}
              className="text-2xl font-semibold tracking-widest uppercase md:text-3xl"
            >
              {title}
            </h2>
            <span
              aria-hidden
              className="bg-site-primary mx-auto mt-4 block h-0.5 w-16"
            />
            {subtitle && <p className="text-site-muted mt-4">{subtitle}</p>}
          </header>
        )}
        {children}
      </Reveal>
    </section>
  )
}

export function ClassicSteps({ site }: SectionProps) {
  const { steps } = site.content
  if (steps.length === 0) return null
  return (
    <Block id="steps" tone="surface">
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={`${step.title}-${i}`} className="text-center">
            <span className="border-site-primary text-site-primary mx-auto flex size-16 items-center justify-center rounded-full border-2">
              <StepIcon name={step.icon} className="size-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold tracking-widest uppercase">
              {step.title}
            </h2>
            <p className="text-site-muted mt-2">{step.description}</p>
          </li>
        ))}
      </ol>
    </Block>
  )
}

export function ClassicFeatured(props: SectionProps) {
  const { site, route, featured } = props
  const { title, subtitle } = site.content.featured
  return (
    <Block id="featured" title={title} subtitle={subtitle}>
      {featured.length === 0 ? (
        <p className="text-site-muted text-center">
          Estamos cargando nuevas propiedades. Volvé a visitarnos pronto.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((property) => (
            <li key={property.id}>
              <ClassicPropertyCard
                site={site}
                route={route}
                property={property}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-10 text-center">
        <a
          href={hrefFor(route, "/propiedades")}
          className="border-site-primary hover:bg-site-primary hover:text-site-on-primary inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-7 font-semibold"
        >
          Ver todas las propiedades
          <ArrowRight aria-hidden className="size-4" />
        </a>
      </p>
    </Block>
  )
}

export function ClassicMetrics({ site }: SectionProps) {
  const { metrics } = site.content
  if (metrics.length === 0) return null
  return (
    <Block id="metrics" title="Nosotros en números" tone="surface">
      <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <div key={`${metric.label}-${i}`} className="text-center">
            <dd className="text-site-primary order-first text-4xl font-semibold md:text-5xl">
              {metric.value}
            </dd>
            <dt className="text-site-muted mt-2">{metric.label}</dt>
          </div>
        ))}
      </dl>
    </Block>
  )
}

export function ClassicServices({ site }: SectionProps) {
  const { services } = site.content
  if (services.length === 0) return null
  return (
    <Block id="services" title="Nuestros servicios">
      <ul className="grid gap-8">
        {services.map((service, i) => (
          <li
            key={`${service.title}-${i}`}
            className="grid items-center gap-6 md:grid-cols-2"
          >
            <div
              className={cn(
                "rounded-site bg-site-surface aspect-[16/10] overflow-hidden",
                i % 2 === 1 && "md:order-2"
              )}
            >
              {service.imageUrl ? (
                <SiteImage
                  src={service.imageUrl}
                  alt={service.title}
                  width={800}
                  height={500}
                  className="size-full object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="text-site-primary flex size-full items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--site-surface), color-mix(in srgb, var(--site-primary) 25%, var(--site-surface)))",
                  }}
                >
                  <StepIcon name={serviceIcon(i)} className="size-16" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-wide uppercase">
                {service.title}
              </h3>
              <p className="text-site-muted mt-3 whitespace-pre-line">
                {service.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Block>
  )
}

export function ClassicTestimonials({ site }: SectionProps) {
  const { testimonials } = site.content
  if (testimonials.length === 0) return null
  return (
    <Block
      id="testimonials"
      title="Lo que dicen nuestros clientes"
      tone="surface"
    >
      <ul
        tabIndex={0}
        aria-label="Testimonios, deslizá para ver más"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4"
      >
        {testimonials.map((t, i) => (
          <li
            key={`${t.name}-${i}`}
            className="w-[85%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]"
          >
            <figure className="rounded-site border-site-border bg-site-bg flex h-full flex-col border p-6">
              <Quote aria-hidden className="text-site-primary size-8" />
              <blockquote className="mt-3 flex-1 whitespace-pre-line">
                {t.text}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
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

export function ClassicFaqs({ site }: SectionProps) {
  const { faqs } = site.content
  if (faqs.length === 0) return null
  return (
    <Block id="faqs" title="Preguntas frecuentes">
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map((faq, i) => (
          <details
            key={`${faq.question}-${i}`}
            className="group rounded-site border-site-border bg-site-surface border"
          >
            <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-5 py-3 font-medium">
              {faq.question}
              <span
                aria-hidden
                className="text-site-primary text-2xl transition-transform group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="text-site-muted px-5 pt-1 pb-5 whitespace-pre-line">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </Block>
  )
}

export function ClassicAbout({ site }: SectionProps) {
  const { about } = site.content
  if (!about.body) return null
  return (
    <Block id="about" tone="surface">
      <div
        className={cn(
          "grid items-center gap-8",
          about.imageUrl && "md:grid-cols-2"
        )}
      >
        {about.imageUrl && (
          <SiteImage
            src={about.imageUrl}
            alt={about.title}
            width={800}
            height={600}
            className="rounded-site aspect-[4/3] w-full object-cover"
          />
        )}
        <div>
          <h2 className="text-2xl font-semibold tracking-widest uppercase md:text-3xl">
            {about.title}
          </h2>
          <span aria-hidden className="bg-site-primary mt-4 block h-0.5 w-16" />
          <p className="text-site-muted mt-5 whitespace-pre-line">
            {about.body}
          </p>
        </div>
      </div>
    </Block>
  )
}

export function ClassicContactSection({ site, route }: SectionProps) {
  const { contact } = site.content
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage)
  const tel = telLink(contact.phone)
  return (
    <Block
      id="contact"
      title="Contacto"
      subtitle="Escribinos y te respondemos a la brevedad."
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <ul className="space-y-3">
          {contact.address && (
            <li className="flex items-start gap-3">
              <MapPin
                aria-hidden
                className="text-site-primary mt-1 size-5 shrink-0"
              />
              {contact.address}
            </li>
          )}
          {contact.hours && (
            <li className="flex items-start gap-3">
              <Clock
                aria-hidden
                className="text-site-primary mt-1 size-5 shrink-0"
              />
              {contact.hours}
            </li>
          )}
          {tel && (
            <li className="flex items-center gap-3">
              <Phone
                aria-hidden
                className="text-site-primary size-5 shrink-0"
              />
              <a
                href={tel}
                className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              >
                {contact.phone}
              </a>
            </li>
          )}
          {contact.email && (
            <li className="flex items-center gap-3">
              <Mail aria-hidden className="text-site-primary size-5 shrink-0" />
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex min-h-11 items-center break-all underline-offset-4 hover:underline"
              >
                {contact.email}
              </a>
            </li>
          )}
          {wa && (
            <li>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="border-site-primary hover:bg-site-primary hover:text-site-on-primary inline-flex min-h-11 items-center rounded-full border-2 px-5 font-semibold"
              >
                Escribinos por WhatsApp
              </a>
            </li>
          )}
          {contact.socials.length > 0 && (
            <li>
              <ul className="flex gap-1">
                {contact.socials.map((s) => (
                  <li key={s.network}>
                    <SocialLink
                      network={s.network}
                      url={s.url}
                      className="border-site-border hover:text-site-primary inline-flex size-11 items-center justify-center rounded-full border"
                    />
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
        <ContactForm
          base={basePath(route)}
          disabled={route.previewToken !== null}
          className="rounded-site border-site-border bg-site-surface border p-6"
        />
      </div>
    </Block>
  )
}
