import 'server-only'
import { isHiddenPermission } from '@/constants/sections'
import { featureOfPermission } from '@/constants/features'
import { navigationPaths } from '@/constants/navigation'
import { isPlatformRole, pathsForRole } from '@/router/paths'
import type { SignedInSession } from '@/server/session'

export function can(session: SignedInSession, permission: string): boolean {
  return !isHiddenPermission(permission) && session.permissions.has(permission)
}

export function deniedDetail(session: SignedInSession, permission: string): string {
  const feature = featureOfPermission(permission)
  const featureOff = feature !== null && !isPlatformRole(session.user.role) && !session.features.has(feature)
  return featureOff
    ? 'This area is not available for your account. Ask your administrator if you need it.'
    : 'Your role does not include access to this area. An administrator can change what your role is permitted to do.'
}

export function allowedNavigation(session: SignedInSession): string[] {
  const role = session.user.role
  return navigationPaths(pathsForRole(role), (permission) => can(session, permission), role)
}
