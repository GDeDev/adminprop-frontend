import type { SiteTheme } from "@adminprop/shared-types"

/**
 * Mini-maqueta de un sitio pintada con un tema. Los colores y las esquinas
 * vienen de los datos (`defaultTheme` del template o el tema que se está
 * editando): es el único lugar del backoffice donde se pintan colores que no
 * son tokens, porque justamente muestra los del sitio.
 */
export function TemplateMockup({ theme }: { theme: SiteTheme }) {
  const radius = theme.radius
  return (
    <div
      aria-hidden
      className="flex aspect-[16/10] w-full flex-col gap-2 overflow-hidden rounded-md border p-2"
      style={{
        backgroundColor: theme.background,
        borderRadius: Math.min(radius, 12),
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="h-2 w-10 rounded-sm"
          style={{ backgroundColor: theme.text }}
        />
        <div className="flex gap-1">
          <div
            className="h-1.5 w-4 rounded-sm"
            style={{ backgroundColor: theme.secondary }}
          />
          <div
            className="h-1.5 w-4 rounded-sm"
            style={{ backgroundColor: theme.secondary }}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 px-1">
        <div
          className="h-2.5 w-3/4 rounded-sm"
          style={{ backgroundColor: theme.text }}
        />
        <div
          className="h-1.5 w-1/2 rounded-sm"
          style={{ backgroundColor: theme.secondary }}
        />
        <div
          className="mt-0.5 h-3.5 w-12"
          style={{
            backgroundColor: theme.primary,
            borderRadius: Math.min(radius, 8),
          }}
        />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-6"
            style={{
              backgroundColor: theme.surface,
              borderRadius: Math.min(radius, 8),
            }}
          />
        ))}
      </div>
    </div>
  )
}
