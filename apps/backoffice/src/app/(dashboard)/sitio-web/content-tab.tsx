"use client"

import * as React from "react"
import { X } from "lucide-react"

import type { SiteContent } from "@adminprop/shared-types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@adminprop/ui/components/accordion"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import { Label } from "@adminprop/ui/components/label"
import { Switch } from "@adminprop/ui/components/switch"

import { PropertySelect } from "@/components/property-select"
import { useProperty } from "@/lib/properties-api"
import {
  SITE_LIMITS as L,
  SOCIAL_NETWORKS,
  STEP_ICONS,
  type ContentBlock,
} from "@/lib/site"

import {
  ImageField,
  ListEditor,
  SiteSelectField,
  SiteTextField,
  fieldId,
  useClearError,
  useFieldError,
} from "./fields"

type Update = <K extends keyof SiteContent>(
  block: K,
  value: SiteContent[K]
) => void

interface BlockProps<K extends keyof SiteContent> {
  value: SiteContent[K]
  set: (value: SiteContent[K]) => void
}

/* ------------------------------------------------------------------ */
/* Bloques                                                              */
/* ------------------------------------------------------------------ */

function BrandBlock({ value, set }: BlockProps<"brand">) {
  return (
    <FieldGroup>
      <SiteTextField
        path="content.brand.displayName"
        label="Nombre que se muestra"
        value={value.displayName}
        limit={L.displayName}
        onChange={(v) => set({ ...value, displayName: v ?? "" })}
      />
      <SiteTextField
        path="content.brand.tagline"
        label="Frase corta"
        value={value.tagline}
        limit={L.tagline}
        nullable
        onChange={(v) => set({ ...value, tagline: v })}
      />
      <ImageField
        path="content.brand.logoUrl"
        label="Logo"
        value={value.logoUrl}
        onChange={(url) => set({ ...value, logoUrl: url })}
        description="Si no subís uno, se usa el logo de la inmobiliaria. JPG, PNG o WebP, hasta 5 MB."
      />
      <ImageField
        path="content.brand.faviconUrl"
        label="Ícono de la pestaña (favicon)"
        value={value.faviconUrl}
        onChange={(url) => set({ ...value, faviconUrl: url })}
      />
    </FieldGroup>
  )
}

function ContactBlock({ value, set }: BlockProps<"contact">) {
  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <SiteTextField
          path="content.contact.phone"
          label="Teléfono"
          value={value.phone}
          nullable
          inputMode="tel"
          onChange={(v) => set({ ...value, phone: v })}
        />
        <SiteTextField
          path="content.contact.whatsapp"
          label="WhatsApp"
          value={value.whatsapp}
          nullable
          inputMode="numeric"
          placeholder="5492215551234"
          description="Solo números, con código de país."
          onChange={(v) => set({ ...value, whatsapp: v })}
        />
      </div>
      <SiteTextField
        path="content.contact.whatsappMessage"
        label="Mensaje inicial de WhatsApp"
        value={value.whatsappMessage}
        limit={L.whatsappMessage}
        nullable
        multiline
        rows={2}
        onChange={(v) => set({ ...value, whatsappMessage: v })}
      />
      <SiteTextField
        path="content.contact.email"
        label="Email"
        value={value.email}
        limit={L.email}
        nullable
        inputMode="email"
        onChange={(v) => set({ ...value, email: v })}
      />
      <SiteTextField
        path="content.contact.address"
        label="Dirección"
        value={value.address}
        limit={L.address}
        nullable
        onChange={(v) => set({ ...value, address: v })}
      />
      <SiteTextField
        path="content.contact.hours"
        label="Horarios"
        value={value.hours}
        limit={L.hours}
        nullable
        placeholder="Lun a Vie 9 a 18 · Sáb 9 a 13"
        onChange={(v) => set({ ...value, hours: v })}
      />
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium">Redes sociales</h4>
        <ListEditor
          path="content.contact.socials"
          items={value.socials}
          max={L.maxSocials}
          itemLabel="Red"
          addLabel="Agregar red"
          emptyText="Todavía no cargaste redes."
          makeItem={() => ({ network: "INSTAGRAM" as const, url: "" })}
          onChange={(socials) => set({ ...value, socials })}
          renderItem={(item, index, update) => (
            <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
              <SiteSelectField
                path={`content.contact.socials[${index}].network`}
                label="Red"
                value={item.network}
                options={SOCIAL_NETWORKS}
                onChange={(network) => update({ ...item, network })}
              />
              <SiteTextField
                path={`content.contact.socials[${index}].url`}
                label="Link"
                value={item.url}
                inputMode="url"
                placeholder="https://www.instagram.com/tu-inmobiliaria"
                onChange={(url) => update({ ...item, url: url ?? "" })}
              />
            </div>
          )}
        />
      </div>
    </FieldGroup>
  )
}

function HeroBlock({ value, set }: BlockProps<"hero">) {
  const switchId = fieldId("content.hero.showSearch")
  return (
    <FieldGroup>
      <SiteTextField
        path="content.hero.title"
        label="Título"
        value={value.title}
        limit={L.heroTitle}
        onChange={(v) => set({ ...value, title: v ?? "" })}
      />
      <SiteTextField
        path="content.hero.subtitle"
        label="Subtítulo"
        value={value.subtitle}
        limit={L.heroSubtitle}
        nullable
        multiline
        rows={2}
        onChange={(v) => set({ ...value, subtitle: v })}
      />
      <SiteTextField
        path="content.hero.ctaLabel"
        label="Texto del botón"
        value={value.ctaLabel}
        limit={L.ctaLabel}
        nullable
        placeholder="Contactanos hoy"
        onChange={(v) => set({ ...value, ctaLabel: v })}
      />
      <ImageField
        path="content.hero.backgroundImageUrl"
        label="Imagen de fondo"
        value={value.backgroundImageUrl}
        onChange={(url) => set({ ...value, backgroundImageUrl: url })}
      />
      <div className="flex min-h-11 items-center gap-3">
        <Switch
          id={switchId}
          checked={value.showSearch}
          onCheckedChange={(showSearch) => set({ ...value, showSearch })}
        />
        <Label htmlFor={switchId}>Mostrar el buscador de propiedades</Label>
      </div>
    </FieldGroup>
  )
}

function StepsBlock({ value, set }: BlockProps<"steps">) {
  return (
    <ListEditor
      path="content.steps"
      items={value}
      max={L.maxSteps}
      itemLabel="Paso"
      addLabel="Agregar paso"
      emptyText="Sin pasos: la sección no se muestra."
      makeItem={() => ({ title: "", description: "", icon: "search" as const })}
      onChange={set}
      renderItem={(item, index, update) => (
        <FieldGroup>
          <SiteSelectField
            path={`content.steps[${index}].icon`}
            label="Ícono"
            value={item.icon}
            options={STEP_ICONS}
            onChange={(icon) => update({ ...item, icon })}
          />
          <SiteTextField
            path={`content.steps[${index}].title`}
            label="Título"
            value={item.title}
            limit={L.stepTitle}
            onChange={(v) => update({ ...item, title: v ?? "" })}
          />
          <SiteTextField
            path={`content.steps[${index}].description`}
            label="Descripción"
            value={item.description}
            limit={L.stepDescription}
            multiline
            rows={2}
            onChange={(v) => update({ ...item, description: v ?? "" })}
          />
        </FieldGroup>
      )}
    />
  )
}

function FeaturedPropertyRow({
  id,
  onRemove,
}: {
  id: string
  onRemove: () => void
}) {
  const property = useProperty(id)
  const label = property.data?.address ?? "Propiedad"
  return (
    <li className="flex items-center justify-between gap-2 rounded-md border bg-card py-1 pr-1 pl-3 text-sm">
      <span className="min-w-0 truncate">
        {property.isError ? "Propiedad no disponible" : label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Quitar ${label}`}
        onClick={onRemove}
      >
        <X aria-hidden />
      </Button>
    </li>
  )
}

function FeaturedBlock({ value, set }: BlockProps<"featured">) {
  const countPath = "content.featured.count"
  const countError = useFieldError(countPath)
  const clear = useClearError()
  const idsError = useFieldError("content.featured.propertyIds")
  const [pickerKey, setPickerKey] = React.useState(0)

  return (
    <FieldGroup>
      <SiteTextField
        path="content.featured.title"
        label="Título de la sección"
        value={value.title}
        limit={L.sectionTitle}
        onChange={(v) => set({ ...value, title: v ?? "" })}
      />
      <SiteTextField
        path="content.featured.subtitle"
        label="Subtítulo"
        value={value.subtitle}
        limit={L.sectionSubtitle}
        nullable
        onChange={(v) => set({ ...value, subtitle: v })}
      />
      <SiteSelectField
        path="content.featured.mode"
        label="Qué propiedades se muestran"
        value={value.mode}
        options={[
          { key: "LATEST", label: "Las últimas disponibles" },
          { key: "MANUAL", label: "Las elijo yo" },
        ]}
        onChange={(mode) => set({ ...value, mode })}
      />
      <Field data-invalid={countError ? true : undefined}>
        <FieldLabel htmlFor={fieldId(countPath)}>
          Cantidad a mostrar ({L.minFeatured} a {L.maxFeatured})
        </FieldLabel>
        <Input
          id={fieldId(countPath)}
          type="number"
          inputMode="numeric"
          min={L.minFeatured}
          max={L.maxFeatured}
          value={value.count}
          aria-invalid={countError ? true : undefined}
          onChange={(event) => {
            clear(countPath)
            set({ ...value, count: Number(event.target.value) || 0 })
          }}
        />
        {countError && <FieldError errors={[{ message: countError }]} />}
      </Field>
      {value.mode === "MANUAL" && (
        <div className="flex flex-col gap-2">
          <Label>Propiedades elegidas</Label>
          {value.propertyIds.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {value.propertyIds.map((id) => (
                <FeaturedPropertyRow
                  key={id}
                  id={id}
                  onRemove={() =>
                    set({
                      ...value,
                      propertyIds: value.propertyIds.filter((p) => p !== id),
                    })
                  }
                />
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Todavía no elegiste ninguna. Para publicar hace falta al menos
              una.
            </p>
          )}
          <PropertySelect
            key={pickerKey}
            value={null}
            placeholder="Agregar una propiedad…"
            aria-label="Agregar una propiedad destacada"
            onChange={(propertyId) => {
              if (!propertyId || value.propertyIds.includes(propertyId)) return
              if (value.propertyIds.length >= L.maxFeatured) return
              set({
                ...value,
                propertyIds: [...value.propertyIds, propertyId],
              })
              setPickerKey((k) => k + 1)
            }}
          />
          <FieldDescription>
            Hasta {L.maxFeatured}. Solo se muestran las que estén disponibles.
          </FieldDescription>
          {idsError && <FieldError errors={[{ message: idsError }]} />}
        </div>
      )}
    </FieldGroup>
  )
}

function MetricsBlock({ value, set }: BlockProps<"metrics">) {
  return (
    <ListEditor
      path="content.metrics"
      items={value}
      max={L.maxMetrics}
      itemLabel="Número"
      addLabel="Agregar número"
      emptyText="Sin números: la sección no se muestra."
      makeItem={() => ({ value: "", label: "" })}
      onChange={set}
      renderItem={(item, index, update) => (
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <SiteTextField
            path={`content.metrics[${index}].value`}
            label="Valor"
            value={item.value}
            limit={L.metricValue}
            placeholder="+120"
            onChange={(v) => update({ ...item, value: v ?? "" })}
          />
          <SiteTextField
            path={`content.metrics[${index}].label`}
            label="Qué mide"
            value={item.label}
            limit={L.metricLabel}
            placeholder="Propiedades administradas"
            onChange={(v) => update({ ...item, label: v ?? "" })}
          />
        </div>
      )}
    />
  )
}

function ServicesBlock({ value, set }: BlockProps<"services">) {
  return (
    <ListEditor
      path="content.services"
      items={value}
      max={L.maxServices}
      itemLabel="Servicio"
      addLabel="Agregar servicio"
      emptyText="Sin servicios: la sección no se muestra."
      makeItem={() => ({ title: "", description: "", imageUrl: null })}
      onChange={set}
      renderItem={(item, index, update) => (
        <FieldGroup>
          <SiteTextField
            path={`content.services[${index}].title`}
            label="Título"
            value={item.title}
            limit={L.serviceTitle}
            onChange={(v) => update({ ...item, title: v ?? "" })}
          />
          <SiteTextField
            path={`content.services[${index}].description`}
            label="Descripción"
            value={item.description}
            limit={L.serviceDescription}
            multiline
            onChange={(v) => update({ ...item, description: v ?? "" })}
          />
          <ImageField
            path={`content.services[${index}].imageUrl`}
            label="Imagen"
            value={item.imageUrl}
            onChange={(imageUrl) => update({ ...item, imageUrl })}
          />
        </FieldGroup>
      )}
    />
  )
}

function TestimonialsBlock({ value, set }: BlockProps<"testimonials">) {
  return (
    <ListEditor
      path="content.testimonials"
      items={value}
      max={L.maxTestimonials}
      itemLabel="Testimonio"
      addLabel="Agregar testimonio"
      emptyText="Sin testimonios: la sección no se muestra."
      makeItem={() => ({ name: "", text: "", role: null, photoUrl: null })}
      onChange={set}
      renderItem={(item, index, update) => (
        <FieldGroup>
          <div className="grid gap-3 sm:grid-cols-2">
            <SiteTextField
              path={`content.testimonials[${index}].name`}
              label="Nombre"
              value={item.name}
              limit={L.testimonialName}
              onChange={(v) => update({ ...item, name: v ?? "" })}
            />
            <SiteTextField
              path={`content.testimonials[${index}].role`}
              label="Rol o barrio"
              value={item.role}
              limit={L.testimonialRole}
              nullable
              onChange={(v) => update({ ...item, role: v })}
            />
          </div>
          <SiteTextField
            path={`content.testimonials[${index}].text`}
            label="Testimonio"
            value={item.text}
            limit={L.testimonialText}
            multiline
            onChange={(v) => update({ ...item, text: v ?? "" })}
          />
          <ImageField
            path={`content.testimonials[${index}].photoUrl`}
            label="Foto"
            value={item.photoUrl}
            onChange={(photoUrl) => update({ ...item, photoUrl })}
          />
        </FieldGroup>
      )}
    />
  )
}

function FaqsBlock({ value, set }: BlockProps<"faqs">) {
  return (
    <ListEditor
      path="content.faqs"
      items={value}
      max={L.maxFaqs}
      itemLabel="Pregunta"
      addLabel="Agregar pregunta"
      emptyText="Sin preguntas: la sección no se muestra."
      makeItem={() => ({ question: "", answer: "" })}
      onChange={set}
      renderItem={(item, index, update) => (
        <FieldGroup>
          <SiteTextField
            path={`content.faqs[${index}].question`}
            label="Pregunta"
            value={item.question}
            limit={L.faqQuestion}
            onChange={(v) => update({ ...item, question: v ?? "" })}
          />
          <SiteTextField
            path={`content.faqs[${index}].answer`}
            label="Respuesta"
            value={item.answer}
            limit={L.faqAnswer}
            multiline
            rows={4}
            onChange={(v) => update({ ...item, answer: v ?? "" })}
          />
        </FieldGroup>
      )}
    />
  )
}

function AboutBlock({ value, set }: BlockProps<"about">) {
  return (
    <FieldGroup>
      <SiteTextField
        path="content.about.title"
        label="Título"
        value={value.title}
        limit={L.aboutTitle}
        onChange={(v) => set({ ...value, title: v ?? "" })}
      />
      <SiteTextField
        path="content.about.body"
        label="Texto"
        value={value.body}
        limit={L.aboutBody}
        nullable
        multiline
        rows={6}
        description="Texto plano. Los saltos de línea se respetan."
        onChange={(v) => set({ ...value, body: v })}
      />
      <ImageField
        path="content.about.imageUrl"
        label="Imagen"
        value={value.imageUrl}
        onChange={(imageUrl) => set({ ...value, imageUrl })}
      />
    </FieldGroup>
  )
}

function SeoBlock({ value, set }: BlockProps<"seo">) {
  return (
    <FieldGroup>
      <SiteTextField
        path="content.seo.title"
        label="Título para buscadores"
        value={value.title}
        limit={L.seoTitle}
        onChange={(v) => set({ ...value, title: v ?? "" })}
      />
      <SiteTextField
        path="content.seo.description"
        label="Descripción para buscadores"
        value={value.description}
        limit={L.seoDescription}
        multiline
        rows={2}
        onChange={(v) => set({ ...value, description: v ?? "" })}
      />
      <ImageField
        path="content.seo.ogImageUrl"
        label="Imagen al compartir el link"
        value={value.ogImageUrl}
        onChange={(ogImageUrl) => set({ ...value, ogImageUrl })}
        description="La que se ve cuando compartís el sitio por WhatsApp o redes. JPG, PNG o WebP, hasta 5 MB."
      />
    </FieldGroup>
  )
}

/* ------------------------------------------------------------------ */
/* Pestaña                                                              */
/* ------------------------------------------------------------------ */

const BLOCKS: {
  key: Exclude<ContentBlock, "sections">
  title: string
  hint: string
}[] = [
  { key: "brand", title: "Marca", hint: "Nombre, frase y logo" },
  {
    key: "contact",
    title: "Contacto y redes",
    hint: "Teléfono, mail, horarios",
  },
  { key: "hero", title: "Portada", hint: "Lo primero que se ve" },
  { key: "steps", title: "Pasos", hint: "Cómo trabajan" },
  {
    key: "featured",
    title: "Propiedades destacadas",
    hint: "Qué se muestra en el inicio",
  },
  { key: "metrics", title: "Números", hint: "Hasta 4 datos" },
  { key: "services", title: "Servicios", hint: "Hasta 6" },
  { key: "testimonials", title: "Testimonios", hint: "Hasta 12" },
  { key: "faqs", title: "Preguntas frecuentes", hint: "Hasta 20" },
  { key: "about", title: "Nosotros", hint: "Quiénes son" },
  { key: "seo", title: "Buscadores y redes", hint: "Título y descripción" },
]

export function ContentTab({
  content,
  onChange,
  open,
  onOpenChange,
  blocksWithErrors,
}: {
  content: SiteContent
  onChange: Update
  open: string[]
  onOpenChange: (open: string[]) => void
  blocksWithErrors: ContentBlock[]
}) {
  const set =
    <K extends keyof SiteContent>(key: K) =>
    (value: SiteContent[K]) =>
      onChange(key, value)

  return (
    <Accordion
      type="multiple"
      value={open}
      onValueChange={onOpenChange}
      className="rounded-xl border bg-card px-4"
    >
      {BLOCKS.map(({ key, title, hint }) => (
        <AccordionItem key={key} value={key}>
          <AccordionTrigger>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {title}
              <span className="text-xs font-normal text-muted-foreground">
                {hint}
              </span>
              {blocksWithErrors.includes(key) && (
                <Badge variant="mora">Revisar</Badge>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {key === "brand" && (
              <BrandBlock value={content.brand} set={set("brand")} />
            )}
            {key === "contact" && (
              <ContactBlock value={content.contact} set={set("contact")} />
            )}
            {key === "hero" && (
              <HeroBlock value={content.hero} set={set("hero")} />
            )}
            {key === "steps" && (
              <StepsBlock value={content.steps} set={set("steps")} />
            )}
            {key === "featured" && (
              <FeaturedBlock value={content.featured} set={set("featured")} />
            )}
            {key === "metrics" && (
              <MetricsBlock value={content.metrics} set={set("metrics")} />
            )}
            {key === "services" && (
              <ServicesBlock value={content.services} set={set("services")} />
            )}
            {key === "testimonials" && (
              <TestimonialsBlock
                value={content.testimonials}
                set={set("testimonials")}
              />
            )}
            {key === "faqs" && (
              <FaqsBlock value={content.faqs} set={set("faqs")} />
            )}
            {key === "about" && (
              <AboutBlock value={content.about} set={set("about")} />
            )}
            {key === "seo" && <SeoBlock value={content.seo} set={set("seo")} />}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
