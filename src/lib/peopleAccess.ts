import type { AuthUser, RoleName } from '@/types/auth'

export const DEFAULT_ADMIN_LABEL = 'Default admin'

export const ADMIN_OUT_OF_REACH =
  "Only your company's default administrator can change another administrator. Ask them, or the platform owner."

export function adminOutOfReach(me: AuthUser | null | undefined, person: { role: RoleName }): boolean {
  return person.role === 'COMPANY_ADMIN' && Boolean(me?.companyId) && !me?.isDefaultAdmin
}
