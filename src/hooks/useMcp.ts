import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as mcpApi from '@/api/mcp.api'
import { mcpKeys } from '@/lib/queryKeys'
import type { CreateMcpTokenBody, IssuedMcpToken, McpAccess, McpToken } from '@/types/mcp'

export function useMcpAccess(connectionId: string | null, name: string | null) {
  return useQuery<McpAccess>({
    queryKey: mcpKeys.access(connectionId ?? '', name ?? ''),
    queryFn: () => mcpApi.getMcpAccess(connectionId!, name!),
    enabled: Boolean(connectionId && name),
    staleTime: 60_000,
  })
}

export function useMcpTokens(enabled = true) {
  return useQuery<McpToken[]>({
    queryKey: mcpKeys.tokens(),
    queryFn: mcpApi.listMcpTokens,
    enabled,
  })
}

export function useCreateMcpToken() {
  const qc = useQueryClient()
  return useMutation<IssuedMcpToken, unknown, CreateMcpTokenBody>({
    mutationFn: mcpApi.createMcpToken,
    onSuccess: () => qc.invalidateQueries({ queryKey: mcpKeys.tokens() }),
  })
}

export function useRevokeMcpToken() {
  const qc = useQueryClient()
  return useMutation<McpToken, unknown, string>({
    mutationFn: (id) => mcpApi.revokeMcpToken(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: mcpKeys.tokens() }),
  })
}
