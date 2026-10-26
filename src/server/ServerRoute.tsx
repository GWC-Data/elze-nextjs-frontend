import 'server-only'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AbilityProvider } from '@/context/AbilityProvider'
import { RouteDenied } from '@/router/RouteDenied'
import { isHiddenRoute } from '@/router/hiddenRoutes'
import { can, deniedDetail } from '@/server/access'
import { getSession } from '@/server/session'

interface ServerRouteProps {
  routePath?: string
  home?: string
  permission?: string | string[]
  abilities?: readonly string[]
  children: ReactNode
}

export async function ServerRoute({ routePath, home = '/', permission, abilities = [], children }: ServerRouteProps) {
  if (routePath && isHiddenRoute(routePath)) redirect(home)

  const session = await getSession()
  if (session.kind !== 'signed-in' || session.state !== 'AUTHENTICATED') return null

  const anyOf = permission === undefined ? [] : Array.isArray(permission) ? permission : [permission]
  if (anyOf.length > 0 && !anyOf.some((key) => can(session, key))) {
    return <RouteDenied detail={deniedDetail(session, anyOf[0])} backTo={home} />
  }

  return (
    <AbilityProvider
      granted={abilities.filter((key) => can(session, key))}
      declared={process.env.NODE_ENV === 'production' ? undefined : [...abilities]}
    >
      {children}
    </AbilityProvider>
  )
}
