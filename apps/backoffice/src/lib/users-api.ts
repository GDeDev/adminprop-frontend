"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ApiSuccess,
  CreateUserRequest,
  InternalRole,
  Paginated,
  UpdateUserRequest,
  User,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

export interface UserFilters {
  role?: InternalRole
  isActive?: boolean
  page: number
}

export const USERS_PAGE_SIZE = 20

const usersKey = ["users"] as const

/** Admins y empleados de la inmobiliaria (`GET /users`, sólo admin). */
export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: [...usersKey, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccess<Paginated<User>>>(
        "/users",
        {
          params: {
            page: filters.page,
            limit: USERS_PAGE_SIZE,
            role: filters.role,
            isActive: filters.isActive,
          },
        }
      )
      return data.data
    },
    // Al cambiar de página o de filtro se sigue viendo la lista anterior
    // hasta que llega la nueva, en vez de un parpadeo de skeleton.
    placeholderData: keepPreviousData,
  })
}

function useUsersMutation<TVariables>(
  request: (variables: TVariables) => Promise<unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  })
}

export function useCreateUser() {
  return useUsersMutation((body: CreateUserRequest) =>
    apiClient.post<ApiSuccess<User>>("/users", body)
  )
}

export function useUpdateUser() {
  return useUsersMutation(
    ({ id, ...body }: UpdateUserRequest & { id: string }) =>
      apiClient.patch<ApiSuccess<User>>(`/users/${id}`, body)
  )
}

export function useSetUserActive() {
  return useUsersMutation(({ id, active }: { id: string; active: boolean }) =>
    apiClient.patch<ApiSuccess<User>>(
      `/users/${id}/${active ? "activate" : "deactivate"}`
    )
  )
}

export function useResetUserPassword() {
  return useUsersMutation(
    ({ id, newPassword }: { id: string; newPassword: string }) =>
      apiClient.patch(`/users/${id}/password`, { newPassword })
  )
}
