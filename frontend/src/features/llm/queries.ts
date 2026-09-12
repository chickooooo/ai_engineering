import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createModel,
  deactivateModel,
  listModels,
  updateModel,
  type LLMModelCreate,
  type LLMModelUpdate,
} from '../../api/models'
import {
  createProvider,
  deactivateProvider,
  listProviders,
  updateProvider,
  type ProviderCreate,
  type ProviderUpdate,
} from '../../api/providers'

export const providersKey = ['providers'] as const
export const modelsKey = ['models'] as const

export function useProviders() {
  return useQuery({ queryKey: providersKey, queryFn: listProviders })
}

export function useModels() {
  return useQuery({ queryKey: modelsKey, queryFn: listModels })
}

/** Refetch both lists: a retired provider changes how models read. */
function useRefreshLists() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({ queryKey: providersKey })
    await queryClient.invalidateQueries({ queryKey: modelsKey })
  }
}

export function useCreateProvider() {
  const refresh = useRefreshLists()

  return useMutation({
    mutationFn: (body: ProviderCreate) => createProvider(body),
    onSuccess: refresh,
  })
}

export function useUpdateProvider() {
  const refresh = useRefreshLists()

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ProviderUpdate }) =>
      updateProvider(id, body),
    onSuccess: refresh,
  })
}

export function useDeactivateProvider() {
  const refresh = useRefreshLists()

  return useMutation({
    mutationFn: (id: number) => deactivateProvider(id),
    onSuccess: refresh,
  })
}

export function useCreateModel() {
  const refresh = useRefreshLists()

  return useMutation({
    mutationFn: (body: LLMModelCreate) => createModel(body),
    onSuccess: refresh,
  })
}

export function useUpdateModel() {
  const refresh = useRefreshLists()

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: LLMModelUpdate }) =>
      updateModel(id, body),
    onSuccess: refresh,
  })
}

export function useDeactivateModel() {
  const refresh = useRefreshLists()

  return useMutation({
    mutationFn: (id: number) => deactivateModel(id),
    onSuccess: refresh,
  })
}
