import axios, { type AxiosError } from "axios"

import type { ApiError } from "@adminprop/shared-types"

import { clearAccessToken, getAccessToken } from "./auth-token"

const LOGIN_PATH = "/login"

/**
 * Cliente HTTP base contra apps/api.
 *
 * Hoy no hay backend: las pantallas consumen @adminprop/mocks. Cuando un
 * módulo tenga su endpoint, su queryFn pasa a usar este cliente.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15_000,
  withCredentials: true, // refresh token en cookie httpOnly (Fase 4)
})

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
      // TODO(Fase 4): intentar refresh silencioso (POST /auth/refresh) y
      // reintentar la request original antes de mandar a login.
      clearAccessToken()
      if (!window.location.pathname.startsWith(LOGIN_PATH)) {
        window.location.assign(LOGIN_PATH)
      }
    }
    return Promise.reject(error)
  }
)
