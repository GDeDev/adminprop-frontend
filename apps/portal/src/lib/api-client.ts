import axios, { type AxiosError } from "axios"

import type { ApiError } from "@adminprop/shared-types"

import { clearAccessToken, getAccessToken } from "./auth-token"

/**
 * Cliente HTTP base contra apps/api (mismo contrato que el del backoffice).
 *
 * El portal tiene dos áreas logueadas; un 401 manda al login del área en la
 * que está el usuario. Las rutas públicas no redirigen.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15_000,
  withCredentials: true, // refresh token en cookie httpOnly (Fase 4)
})

function loginPathFor(pathname: string) {
  if (pathname.startsWith("/propietario")) return "/propietario/login"
  if (pathname.startsWith("/inquilino")) return "/inquilino/login"
  return null
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // TODO(Fase 4): refresh silencioso (POST /auth/refresh) antes de redirigir.
      clearAccessToken()
      const { pathname } = window.location
      const loginPath = loginPathFor(pathname)
      if (loginPath && pathname !== loginPath) {
        window.location.assign(loginPath)
      }
    }
    return Promise.reject(error)
  }
)
