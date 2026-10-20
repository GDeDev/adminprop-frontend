/**
 * Configuración de la sesión del backoffice, compartida por los route
 * handlers, el proxy y el layout.
 *
 * El prefijo distingue sus cookies de las del portal: en localhost las dos
 * apps comparten cookies aunque corran en puertos distintos.
 */
export const SESSION_COOKIE_PREFIX = "adminprop_bo"

export const LOGIN_PATH = "/login"
export const HOME_PATH = "/dashboard"
