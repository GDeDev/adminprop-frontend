"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  AddInquiryNoteRequest,
  ApiSuccess,
  AssignInquiryRequest,
  ContactAttemptRequest,
  CrmAssignee,
  CrmOverviewDto,
  CreateInquiryRequest,
  InquiryActivity,
  InquiryCard,
  InquiryDetail,
  InquirySource,
  InquiryStage,
  MoveInquiryRequest,
  Paginated,
  PipelineDto,
  PropertyInquiryAnalytics,
  UpdateInquiryRequest,
  WhatsAppLinkDto,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"
import { applyMove } from "./crm"

export const crmKey = ["crm"] as const
const PAGE_SIZE = 20

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

export interface InquiryFilters {
  assignedToId?: string
  propertyId?: string
  source?: InquirySource
  q?: string
  unassigned?: boolean
}

function clean(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== "" && value !== false
    )
  )
}

export function usePipeline(filters: InquiryFilters) {
  return useQuery({
    queryKey: [...crmKey, "pipeline", filters],
    queryFn: () =>
      unwrap<PipelineDto>(
        apiClient.get("/crm/pipeline", { params: clean(filters) })
      ),
  })
}

/** Páginas de una columna ("ver más") o de la lista mobile. */
export function useInfiniteInquiries(
  filters: InquiryFilters & { stage?: InquiryStage },
  enabled = true
) {
  return useInfiniteQuery({
    queryKey: [...crmKey, "inquiries", filters],
    enabled,
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<ApiSuccess<Paginated<InquiryCard>>>(
        "/crm/inquiries",
        {
          params: { ...clean(filters), page: pageParam, limit: PAGE_SIZE },
        }
      )
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

export function useInquiry(id: string | null) {
  return useQuery({
    queryKey: [...crmKey, "inquiry", id],
    enabled: id !== null,
    queryFn: () => unwrap<InquiryDetail>(apiClient.get(`/crm/inquiries/${id}`)),
  })
}

export function useAssignees() {
  return useQuery({
    queryKey: [...crmKey, "assignees"],
    staleTime: 5 * 60_000,
    queryFn: () => unwrap<CrmAssignee[]>(apiClient.get("/crm/assignees")),
  })
}

function useInvalidateCrm() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: crmKey })
}

export function useCreateInquiry() {
  const invalidate = useInvalidateCrm()
  return useMutation({
    mutationFn: (body: CreateInquiryRequest) =>
      unwrap<InquiryDetail>(apiClient.post("/crm/inquiries", body)),
    onSuccess: invalidate,
  })
}

export function useUpdateInquiry(id: string) {
  const invalidate = useInvalidateCrm()
  return useMutation({
    mutationFn: (body: UpdateInquiryRequest) =>
      unwrap<InquiryDetail>(apiClient.patch(`/crm/inquiries/${id}`, body)),
    onSuccess: invalidate,
  })
}

/**
 * Mueve una tarjeta. La columna se actualiza al instante (optimista); si la
 * API rechaza el cambio o hay conflicto, se vuelve al estado anterior y se
 * recarga todo (DT-99).
 */
export function useMoveInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      variables: MoveInquiryRequest & { id: string; index: number }
    ) => {
      const { id, stage, beforeId, afterId, lostReason, contractId } = variables
      const body: MoveInquiryRequest = {
        stage,
        ...(beforeId ? { beforeId } : {}),
        ...(afterId ? { afterId } : {}),
        ...(lostReason ? { lostReason } : {}),
        ...(contractId ? { contractId } : {}),
      }
      return unwrap<InquiryCard>(
        apiClient.patch(`/crm/inquiries/${id}/stage`, body)
      )
    },
    onMutate: async ({ id, stage, index }) => {
      await queryClient.cancelQueries({ queryKey: [...crmKey, "pipeline"] })
      const previous = queryClient.getQueriesData<PipelineDto>({
        queryKey: [...crmKey, "pipeline"],
      })
      for (const [key, pipeline] of previous) {
        if (pipeline) {
          queryClient.setQueryData(key, applyMove(pipeline, id, stage, index))
        }
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      for (const [key, pipeline] of context?.previous ?? []) {
        queryClient.setQueryData(key, pipeline)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: crmKey }),
  })
}

export function useAssignInquiry() {
  const invalidate = useInvalidateCrm()
  return useMutation({
    mutationFn: ({ id, userId }: { id: string } & AssignInquiryRequest) =>
      unwrap<InquiryCard>(
        apiClient.patch(`/crm/inquiries/${id}/assign`, { userId })
      ),
    onSuccess: invalidate,
  })
}

export function useAddNote(id: string) {
  const invalidate = useInvalidateCrm()
  return useMutation({
    mutationFn: (body: AddInquiryNoteRequest) =>
      unwrap<InquiryActivity>(
        apiClient.post(`/crm/inquiries/${id}/notes`, body)
      ),
    onSuccess: invalidate,
  })
}

export function useContactAttempt() {
  const invalidate = useInvalidateCrm()
  return useMutation({
    mutationFn: ({ id, channel }: { id: string } & ContactAttemptRequest) =>
      unwrap<InquiryCard>(
        apiClient.post(`/crm/inquiries/${id}/contact-attempts`, { channel })
      ),
    onSuccess: invalidate,
  })
}

export function fetchWhatsAppLink(
  id: string,
  templateKey?: string
): Promise<WhatsAppLinkDto> {
  return unwrap<WhatsAppLinkDto>(
    apiClient.get(`/crm/inquiries/${id}/whatsapp-link`, {
      params: templateKey ? { templateKey } : undefined,
    })
  )
}

export function useCrmOverview(range: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [...crmKey, "overview", range],
    queryFn: () =>
      unwrap<CrmOverviewDto>(
        apiClient.get("/crm/analytics/overview", { params: clean(range) })
      ),
  })
}

export function usePropertyAnalytics(
  propertyId: string,
  range: { from?: string; to?: string } = {}
) {
  return useQuery({
    queryKey: [...crmKey, "property-analytics", propertyId, range],
    queryFn: () =>
      unwrap<PropertyInquiryAnalytics>(
        apiClient.get(`/crm/analytics/properties/${propertyId}`, {
          params: clean(range),
        })
      ),
  })
}
