// Generated from the route table. Used by the router shim to recover path params.
export const ROUTE_PATTERNS: string[] = [
  "/activity",
  "/agents",
  "/agents/new",
  "/architecture",
  "/dashboards",
  "/data",
  "/metadata-lakehouse",
  "/metadata-lakehouse/builder",
  "/metadata-lakehouse/drafts",
  "/metadata-lakehouse/published",
  "/nexus/playbooks",
  "/platform/agents",
  "/platform/agents/new",
  "/platform/architecture",
  "/platform/audit",
  "/platform/companies",
  "/platform/dashboards",
  "/platform/data",
  "/platform/groups",
  "/platform/metadata-lakehouse",
  "/platform/metadata-lakehouse/builder",
  "/platform/metadata-lakehouse/drafts",
  "/platform/metadata-lakehouse/published",
  "/platform/nexus/playbooks",
  "/platform/profile",
  "/platform/roles",
  "/platform/settings",
  "/platform/users",
  "/settings",
  "/settings/company",
  "/settings/profile",
  "/team/access",
  "/team/groups",
  "/team/roles",
  "/team/users",
  "/workspace",
  "/agents/:agentId",
  "/agents/:agentId/edit",
  "/dashboards/:dashboardId",
  "/metadata-lakehouse/connections/:id",
  "/platform/agents/:agentId",
  "/platform/agents/:agentId/edit",
  "/platform/companies/:companyId",
  "/platform/dashboards/:dashboardId",
  "/platform/metadata-lakehouse/connections/:id",
  "/platform/playbooks/:connectionId?",
  "/platform/users/:userId",
  "/playbooks/:connectionId?",
  "/team/users/:userId",
  "/agents/:agentId/chat/:sessionId",
  "/data-analyst/:connectionId?/:sessionId?",
  "/platform/agents/:agentId/chat/:sessionId",
  "/platform/data-analyst/:connectionId?/:sessionId?",
  "/platform/playbook-builder/:connectionId/:sessionId?",
  "/playbook-builder/:connectionId/:sessionId?",
  "/context/*",
  "/platform/context/*"
]

function compile(pattern: string): { regex: RegExp; names: string[] } {
  const names: string[] = []
  let source = ''
  for (const part of pattern.split('/').filter(Boolean)) {
    if (part === '*') {
      names.push('*')
      source += '(?:/(.*))?'
    } else if (part.startsWith(':')) {
      const optional = part.endsWith('?')
      names.push(part.slice(1).replace('?', ''))
      source += optional ? '(?:/([^/]+))?' : '/([^/]+)'
    } else {
      source += '/' + part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
  }
  return { regex: new RegExp('^' + source + '/?$'), names }
}

const COMPILED = ROUTE_PATTERNS.map(compile)

export function matchRouteParams(pathname: string): Record<string, string | undefined> {
  for (const { regex, names } of COMPILED) {
    const m = regex.exec(pathname)
    if (!m) continue
    const out: Record<string, string | undefined> = {}
    names.forEach((n, i) => {
      out[n] = m[i + 1] ? decodeURIComponent(m[i + 1]) : undefined
    })
    return out
  }
  return {}
}
