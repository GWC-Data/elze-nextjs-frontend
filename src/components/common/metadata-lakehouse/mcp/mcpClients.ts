import type { McpClientTemplates } from '@/types/mcp'

export type McpClientId = 'claudeDesktop' | 'claudeCode' | 'cursor'

export interface McpClientGuide {
  id: McpClientId
  label: string
  hint: string
  snippet: (templates: McpClientTemplates) => string
}

export const MCP_CLIENTS: McpClientGuide[] = [
  {
    id: 'claudeDesktop',
    label: 'Claude Desktop',
    hint: 'Paste into Settings → Developer → Edit Config, then restart Claude Desktop.',
    snippet: (templates) => JSON.stringify(templates.claudeDesktop, null, 2),
  },
  {
    id: 'claudeCode',
    label: 'Claude Code',
    hint: 'Run this command in a terminal.',
    snippet: (templates) => templates.claudeCode,
  },
  {
    id: 'cursor',
    label: 'Cursor',
    hint: 'Paste into .cursor/mcp.json, then reload Cursor.',
    snippet: (templates) => JSON.stringify(templates.http, null, 2),
  },
]

export function withToken(text: string, placeholder: string, token: string | null): string {
  return token ? text.split(placeholder).join(token) : text
}
