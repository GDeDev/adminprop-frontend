import type { ReactNode } from "react"

/** LUXURY: título centrado en serif con un filete fino debajo. */
export function LuxuryPageTitle({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string | null
  children?: ReactNode
}) {
  return (
    <div className="border-site-border border-b">
      <div className="mx-auto max-w-6xl px-4 py-14 text-center md:py-20">
        <h1 className="font-site-display text-4xl tracking-wide md:text-5xl">
          {title}
        </h1>
        <span
          aria-hidden
          className="bg-site-primary mx-auto mt-6 block h-px w-16"
        />
        {subtitle && (
          <p className="text-site-muted mx-auto mt-6 max-w-2xl text-lg">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-10 text-left">{children}</div>}
      </div>
    </div>
  )
}
