import { SHOW_AGENT_LIBRARY, SHOW_ANALYTICS } from '@/constants/sections'

const HIDDEN_ROUTES: RegExp[] = [
  ...(SHOW_ANALYTICS ? [] : [/^\/?dashboards(\/|$)/, /^\/?data$/, /^\/team\/access$/]),
  ...(SHOW_AGENT_LIBRARY ? [] : [/^\/?agents(\/|$)/]),
]

export function isHiddenRoute(routePath: string): boolean {
  return HIDDEN_ROUTES.some((pattern) => pattern.test(routePath))
}
