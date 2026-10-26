import { del, deleteConfig, get, patch, post, put } from '@/api/client'
import type { DeleteOptions, DeleteResult } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { RoleName } from '@/types/auth'
import type { AdminUser, ListQuery, Paged, UserListItem, UserPermissions } from '@/types/admin'

export interface NewPerson {
  username: string
  email: string
  displayName?: string
  role: RoleName
  customRoleId?: string | null
  companyId?: string
}

export function createUsersApi(base: string) {
  return {
    list: (query: ListQuery & { companyId?: string; role?: string; status?: string }) =>
      get<Paged<UserListItem>>(base, { params: query }),
    fetch: (id: string) => get<AdminUser>(endpoints.person.one(base, id)),
    create: (body: NewPerson) => post<AdminUser>(base, body),
    update: (id: string, body: { role?: RoleName; customRoleId?: string | null; displayName?: string | null }) =>
      patch<AdminUser>(endpoints.person.one(base, id), body),
    deactivate: (id: string) => post<AdminUser>(endpoints.person.deactivate(base, id)),
    activate: (id: string) => post<AdminUser>(endpoints.person.activate(base, id)),
    resendActivation: (id: string) => post<AdminUser>(endpoints.person.activation(base, id)),
    remove: (id: string, options?: DeleteOptions) =>
      del<DeleteResult>(endpoints.person.one(base, id), deleteConfig(options)),
    permissions: (id: string) => get<UserPermissions>(endpoints.person.permissions(base, id)),
    savePermissions: (id: string, permissionIds: string[]) =>
      put<UserPermissions>(endpoints.person.permissions(base, id), { permissionIds }),
  }
}

export const platformUsers = createUsersApi(endpoints.platform.users)

export const teamUsers = createUsersApi(endpoints.users.root)
