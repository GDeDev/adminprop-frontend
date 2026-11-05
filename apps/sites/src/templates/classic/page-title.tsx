import type { ReactNode } from "react"

export function ClassicPageTitle({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string | null
  children?: ReactNode
}) {
  return (
    <div className="border-site-border bg-site-surface border-b">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <h1 className="text-3xl font-semibold tracking-wide uppercase md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-site-muted mt-3 max-w-2xl">{subtitle}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  )
}
