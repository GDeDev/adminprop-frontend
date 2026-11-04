import type { ReactNode } from "react"

export function ModernPageTitle({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string | null
  children?: ReactNode
}) {
  return (
    <div className="bg-site-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-site-muted mt-3 max-w-2xl text-lg">{subtitle}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  )
}
