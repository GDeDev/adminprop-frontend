import { Clock, Mail, MapPin, Phone } from "lucide-react"
import type { ReactNode } from "react"

import { ContactForm } from "@/components/contact-form"
import { serviceIcon, SocialLink, StepIcon } from "@/components/icons"
import { Reveal } from "@/components/reveal"
import { SiteImage } from "@/components/site-image"
import { cn } from "@/lib/cn"
import { mailtoHref } from "@/lib/safe-links"
import { basePath, hrefFor } from "@/lib/site-route"
import { telLink, whatsappLink } from "@/lib/whatsapp"

import type { SectionProps } from "../types"
import { LuxuryPropertyCard } from "./card"

const EYEBROW = "text-xs font-semibold tracking-[0.3em] uppercase"

/** Contenedor de sección de LUXURY: títulos centrados en serif con un filete. */
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
        "py-20 md:py-28",
        tone === "surface" && "bg-site-surface",
        className
      )}
    >
      <Reveal className="mx-auto max-w-6xl px-4">
        {title && (
          <header className="mx-auto mb-14 max-w-2xl text-center">
            <h2
              id={`${id}-title`}
              className="font-site-display text-3xl md:text-4xl"
            >
              {title}
            </h2>
            <span
              aria-hidden
              className="bg-site-primary mx-auto mt-5 block h-px w-14"
            />
            {subtitle && (
              <p className="text-site-muted mt-5 text-lg">{subtitle}</p>
            )}
          </header>
        )}
        {children}
      </Reveal>
    </section>
  )
}

export function LuxurySteps({ site }: SectionProps) {
  const { steps } = site.content
  if (steps.length === 0) return null
  return (
    <Block id="steps">
      <ol className="divide-site-border grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
        {steps.map((step, i) => (
          <li key={`${step.title}-${i}`} className="px-6 text-center">
            <StepIcon
              name={step.icon}
              className="text-site-primary mx-auto size-8"
            />
            <p aria-hidden className={cn(EYEBROW, "text-site-muted mt-4")}>
              {String(i + 1).padStart(2, "0")}
            </p>
            <h2 className="font-site-display mt-2 text-xl">{step.title}</h2>
            <p className="text-site-muted mt-3">{step.description}</p>
          </li>
        ))}
      </ol>
    </Block>
  )
}

export function LuxuryFeatured(props: SectionProps) {
  const { site, route, featured } = props
  const { title, subtitle } = site.content.featured
  return (
    <Block id="featured" title={title} subtitle={subtitle} tone="surface">
      {featured.length === 0 ? (
        <p className="text-site-muted text-center">
          Estamos cargando nuevas propiedades. Volvé a visitarnos pronto.
        </p>
      ) : (
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((property) => (
            <li key={property.id}>
              <LuxuryPropertyCard
                site={site}
                route={route}
                property={property}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-14 text-center">
        <a
          href={hrefFor(route, "/propiedades")}
          className="border-site-text rounded-site inline-flex min-h-12 items-center border px-8 text-sm font-semibold tracking-[0.18em] uppercase"
        >
          Ver todas las propiedades
        </a>
      </p>
    </Block>
  )
}

export function LuxuryMetrics({ site }: SectionProps) {
  const { metrics } = site.content
  if (metrics.length === 0) return null
  return (
    <Block id="metrics" title="Nosotros en números">
      <dl className="divide-site-border border-site-border grid divide-y border-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {metrics.map((metric, i) => (
          <div key={`${metric.label}-${i}`} className="px-6 py-10 text-center">
            <dd className="font-site-display order-first text-5xl">
              {metric.value}
            </dd>
            <dt className={cn(EYEBROW, "text-site-muted mt-3")}>
              {metric.label}
            </dt>
          </div>
        ))}
      </dl>
    </Block>
  )
}

export function LuxuryServices({ site }: SectionProps) {
  const { services } = site.content
  if (services.length === 0) return null
  return (
    <Block id="services" title="Nuestros servicios" tone="surface">
      <ul className="space-y-16">
        {services.map((service, i) => (
          <li
            key={`${service.title}-${i}`}
            className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
          >
            <div
              className={cn(
                "rounded-site bg-site-bg aspect-[4/3] overflow-hidden",
                i % 2 === 1 && "md:order-last"
              )}
            >
              {service.imageUrl ? (
                <SiteImage
                  src={service.imageUrl}
                  alt={service.title}
                  width={800}
                  height={600}
                  className="size-full object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="text-site-primary flex size-full items-center justify-center"
                >
                  <StepIcon name={serviceIcon(i)} className="size-16" />
                </div>
              )}
            </div>
            <div>
              <p aria-hidden className={cn(EYEBROW, "text-site-muted")}>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="font-site-display mt-3 text-2xl md:text-3xl">
                {service.title}
              </h3>
              <p className="text-site-muted mt-4 text-lg whitespace-pre-line">
                {service.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Block>
  )
}

export function LuxuryTestimonials({ site }: SectionProps) {
  const { testimonials } = site.content
  if (testimonials.length === 0) return null
  return (
    <Block id="testimonials" title="Lo que dicen nuestros clientes">
      <ul className="grid gap-12 md:grid-cols-2">
        {testimonials.map((t, i) => (
          <li key={`${t.name}-${i}`}>
            <figure className="border-site-border flex h-full flex-col border-l-2 pl-6">
              <blockquote className="font-site-display flex-1 text-xl leading-relaxed whitespace-pre-line">
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
                  <span className={cn(EYEBROW, "block")}>{t.name}</span>
                  {t.role && (
                    <span className="text-site-muted mt-1 block text-sm">
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

export function LuxuryFaqs({ site }: SectionProps) {
  const { faqs } = site.content
  if (faqs.length === 0) return null
  return (
    <Block id="faqs" title="Preguntas frecuentes" tone="surface">
      <div className="divide-site-border border-site-border mx-auto max-w-3xl divide-y border-y">
        {faqs.map((faq, i) => (
          <details key={`${faq.question}-${i}`} className="group">
            <summary className="font-site-display flex min-h-14 cursor-pointer items-center justify-between gap-4 py-4 text-lg">
              {faq.question}
              <span
                aria-hidden
                className="text-site-primary text-2xl transition-transform group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="text-site-muted pb-6 whitespace-pre-line">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </Block>
  )
}

export function LuxuryAbout({ site }: SectionProps) {
  const { about } = site.content
  if (!about.body) return null
  return (
    <Block id="about">
      <div
        className={cn(
          "grid items-center gap-12",
          about.imageUrl && "md:grid-cols-2"
        )}
      >
        <div className={cn(!about.imageUrl && "mx-auto max-w-3xl text-center")}>
          <h2 className="font-site-display text-3xl md:text-4xl">
            {about.title}
          </h2>
          <span
            aria-hidden
            className={cn(
              "bg-site-primary mt-5 block h-px w-14",
              !about.imageUrl && "mx-auto"
            )}
          />
          <p className="text-site-muted mt-6 text-lg whitespace-pre-line">
            {about.body}
          </p>
        </div>
        {about.imageUrl && (
          <SiteImage
            src={about.imageUrl}
            alt={about.title}
            width={800}
            height={1000}
            className="rounded-site aspect-[4/5] w-full object-cover"
          />
        )}
      </div>
    </Block>
  )
}

export function LuxuryContactSection({ site, route }: SectionProps) {
  const { contact } = site.content
  const wa = whatsappLink(contact.whatsapp, contact.whatsappMessage)
  const tel = telLink(contact.phone)
  const mail = mailtoHref(contact.email)
  return (
    <Block id="contact" tone="surface" className="pb-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2
            id="contact-title"
            className="font-site-display text-3xl md:text-4xl"
          >
            Contacto
          </h2>
          <span aria-hidden className="bg-site-primary mt-5 block h-px w-14" />
          <p className="text-site-muted mt-5">
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
            {mail && (
              <li className="flex items-center gap-3">
                <Mail aria-hidden className="size-5 shrink-0" />
                <a
                  href={mail}
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
                className="border-site-text rounded-site inline-flex min-h-11 items-center border px-6 text-sm font-semibold tracking-[0.15em] uppercase"
              >
                Escribinos por WhatsApp
              </a>
            )}
            {contact.socials.map((s) => (
              <SocialLink
                key={s.network}
                network={s.network}
                url={s.url}
                className="border-site-border hover:bg-site-text hover:text-site-bg inline-flex size-11 items-center justify-center rounded-full border"
              />
            ))}
          </div>
        </div>
        <ContactForm
          base={basePath(route)}
          disabled={route.previewToken !== null}
          className="rounded-site border-site-border bg-site-bg border p-6 md:p-8"
        />
      </div>
    </Block>
  )
}
