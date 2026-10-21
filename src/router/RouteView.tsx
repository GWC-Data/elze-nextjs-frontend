'use client'

import type { ReactElement } from 'react'
import { Navigate } from '@/lib/router'
import { RequirePermission } from '@/router/guards'
import { SHOW_AGENT_LIBRARY, SHOW_ANALYTICS } from '@/constants/sections'

const HIDDEN_ROUTES: RegExp[] = [
  ...(SHOW_ANALYTICS ? [] : [/^\/?dashboards(\/|$)/, /^\/?data$/, /^\/team\/access$/]),
  ...(SHOW_AGENT_LIBRARY ? [] : [/^\/?agents(\/|$)/]),
]

interface RouteViewProps {
  /** Route path as declared (no shell prefix for the platform shell, leading slash for the workspace shell). */
  routePath: string
  /** Where hidden routes bounce to. */
  home: string
  permission?: string | string[]
  children: ReactElement
}

export function RouteView({ routePath, home, permission, children }: RouteViewProps) {
  if (HIDDEN_ROUTES.some((pattern) => pattern.test(routePath))) return <Navigate to={home} replace />
  return permission ? <RequirePermission permission={permission}>{children}</RequirePermission> : children
}
