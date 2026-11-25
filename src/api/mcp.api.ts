import { del, get, post } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { CreateMcpTokenBody, IssuedMcpToken, McpAccess, McpToken } from '@/types/mcp'

export function getMcpAccess(connectionId: string, name: string): Promise<McpAccess> {
  return get<McpAccess>(endpoints.context.mcp(connectionId), { params: { name } })
}

export function listMcpTokens(): Promise<McpToken[]> {
  return get<McpToken[]>(endpoints.mcp.tokens)
}

export function createMcpToken(body: CreateMcpTokenBody): Promise<IssuedMcpToken> {
  return post<IssuedMcpToken>(endpoints.mcp.tokens, body)
}

export function revokeMcpToken(id: string): Promise<McpToken> {
  return del<McpToken>(endpoints.mcp.token(id))
}
