import { del, deleteConfig, get, patch, post, put } from '@/api/client'
import type { DeleteOptions, DeleteResult } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { CompanyRole, CompanyRoleInput, CompanyRoles, RolePermissionOptions } from '@/types/admin'

const withCompany = (companyId?: string) => (companyId ? { params: { companyId } } : undefined)

export function listCompanyRoles(companyId?: string): Promise<CompanyRoles> {
  return get<CompanyRoles>(endpoints.companyRoles.root, withCompany(companyId))
}

export function listRolePermissionOptions(companyId?: string): Promise<RolePermissionOptions> {
  return get<RolePermissionOptions>(endpoints.companyRoles.permissions, withCompany(companyId))
}

export function createCompanyRole(body: CompanyRoleInput): Promise<CompanyRole> {
  return post<CompanyRole>(endpoints.companyRoles.root, body)
}

export function updateCompanyRole(id: string, body: Partial<CompanyRoleInput>): Promise<CompanyRole> {
  return patch<CompanyRole>(endpoints.companyRoles.one(id), body)
}

export function deleteCompanyRole(id: string, options?: DeleteOptions): Promise<DeleteResult> {
  return del<DeleteResult>(endpoints.companyRoles.one(id), deleteConfig(options))
}

export function saveBuiltInRole(roleId: string, permissionIds: string[], companyId?: string): Promise<CompanyRoles> {
  return put<CompanyRoles>(endpoints.companyRoles.builtIn(roleId), { permissionIds, companyId })
}

export function resetBuiltInRole(roleId: string, companyId?: string): Promise<CompanyRoles> {
  return del<CompanyRoles>(endpoints.companyRoles.builtIn(roleId), withCompany(companyId))
}
