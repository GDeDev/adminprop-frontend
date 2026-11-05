import { cn } from "@/lib/cn"

/**
 * Imagen remota con alt obligatorio. Es un `<img>` a propósito: las fotos de
 * cada inmobiliaria vienen de su storage o de hosts permitidos, y el
 * optimizador de Next obligaría a listar todos esos dominios (y sería un
 * proxy abierto a cualquier URL).
 */
export function SiteImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes,
}: {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  sizes?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      referrerPolicy="no-referrer"
      className={cn(className)}
    />
  )
}
