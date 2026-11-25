export type McpTokenStatus = 'active' | 'expired' | 'revoked'

export interface McpToken {
  id: string
  name: string
  prefix: string
  scope: string
  status: McpTokenStatus
  createdAt: string
  expiresAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export interface IssuedMcpToken extends McpToken {
  token: string
}

export interface CreateMcpTokenBody {
  name: string
  expiresInDays: number
}

export interface McpTool {
  name: string
  description: string
}

export interface McpClientTemplates {
  url: string
  claudeDesktop: Record<string, unknown>
  http: Record<string, unknown>
  claudeCode: string
}

export type McpScope = 'context' | 'all'

export interface McpAccess {
  configured: boolean
  serverName: string
  transport: string
  context: { connectionId: string; name: string; version: string; publishedAt: string | null }
  urls: Record<McpScope, string | null>
  auth: { type: 'bearer'; header: string; format: string; tokenPlaceholder: string; tokens: string }
  tools: McpTool[]
  clients: Record<McpScope, McpClientTemplates | null>
  usage: string
}
