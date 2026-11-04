"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

/**
 * Avisa antes de perder cambios sin guardar:
 * - al cerrar o recargar la pestaña, con el aviso del navegador;
 * - al tocar un link interno (menú, "Volver", etc.), frenando la navegación
 *   y devolviendo `pendingHref` para que la pantalla pida confirmación.
 *
 * El App Router no tiene un evento "antes de navegar", por eso se intercepta
 * el click en los `<a>`. El botón «atrás» del navegador no se puede frenar.
 */
export function useUnsavedGuard(dirty: boolean) {
  const router = useRouter()
  const [pendingHref, setPendingHref] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!dirty) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }
      const anchor = (event.target as Element | null)?.closest?.("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      setPendingHref(`${url.pathname}${url.search}${url.hash}`)
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onClick, true)
    }
  }, [dirty])

  return {
    pendingHref,
    /** Quedarse a seguir editando. */
    stay: () => setPendingHref(null),
    /** Salir sin guardar. */
    leave: () => {
      const href = pendingHref
      setPendingHref(null)
      if (href) router.push(href)
    },
  }
}
