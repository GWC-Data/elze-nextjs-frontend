import { del, deleteConfig, get, post, put } from '@/api/client'
import type { DeleteOptions, DeleteResult } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { teamUsers } from '@/api/users.api'
import type { AccessLevel } from '@/types/auth'
import type { GroupSharedContext } from '@/types/metadataLakehouse'
import type {
  AccessLevelDef,
  Company,
  DashboardGrants,
  DashboardSummary,
  Group,
  GroupDashboards,
  GroupDetail,
  HealthStatus,
  ScopeOptions,
  UserGrant,
  UserOption,
  UserScope,
  WorkspaceOverview,
} from '@/types/admin'

export function fetchMyCompany(): Promise<Company> {
  return get<Company>(endpoints.workspace.company)
}

export function fetchWorkspaceOverview(): Promise<WorkspaceOverview> {
  return get<WorkspaceOverview>(endpoints.workspace.overview)
}

export const listTeam = teamUsers.list
export const fetchTeamMember = teamUsers.fetch
export const createTeamMember = teamUsers.create
export const updateTeamMember = teamUsers.update
export const deactivateTeamMember = teamUsers.deactivate
export const activateTeamMember = teamUsers.activate
export const resendTeamActivation = teamUsers.resendActivation
export const deleteTeamMember = teamUsers.remove

export function listUserOptions(): Promise<UserOption[]> {
  return get<UserOption[]>(endpoints.users.options)
}

export function fetchUserGrants(id: string): Promise<UserGrant[]> {
  return get<UserGrant[]>(endpoints.users.access(id))
}

export function fetchScopeOptions(): Promise<ScopeOptions> {
  return get<ScopeOptions>(endpoints.users.scopeOptions)
}

export function fetchUserScope(id: string): Promise<UserScope> {
  return get<UserScope>(endpoints.users.scope(id))
}

export function saveUserScope(id: string, scopes: Record<string, string[]>): Promise<UserScope> {
  return put<UserScope>(endpoints.users.scope(id), { scopes })
}

export function listGroups(): Promise<Group[]> {
  return get<Group[]>(endpoints.groups.root)
}

export function fetchGroup(id: string): Promise<GroupDetail> {
  return get<GroupDetail>(endpoints.groups.one(id))
}

export function fetchGroupContexts(id: string): Promise<GroupSharedContext[]> {
  return get<GroupSharedContext[]>(endpoints.groups.contexts(id))
}

export function createGroup(body: {
  name: string
  active?: boolean
  userIds?: string[]
  companyId?: string
}): Promise<Group> {
  return post<Group>(endpoints.groups.root, body)
}

export function updateGroup(
  id: string,
  body: { name?: string; active?: boolean; userIds?: string[] }
): Promise<Group> {
  return put<Group>(endpoints.groups.one(id), body)
}

export function deleteGroup(id: string, options?: DeleteOptions): Promise<DeleteResult> {
  return del<DeleteResult>(endpoints.groups.one(id), deleteConfig(options))
}

let levelsCache: Promise<AccessLevelDef[]> | null = null

export function listAccessLevels(): Promise<AccessLevelDef[]> {
  if (!levelsCache) {
    levelsCache = get<AccessLevelDef[]>(endpoints.access.levels).catch((err) => {
      levelsCache = null
      throw err
    })
  }
  return levelsCache
}

async function dashboardLevelId(level: AccessLevel): Promise<string> {
  const match = (await listAccessLevels()).find((l) => l.key === level)
  if (!match) throw new Error(`Unknown access level "${level}"`)
  return match.id
}

export function listGrantableDashboards(companyId?: string): Promise<DashboardSummary[]> {
  return get<DashboardSummary[]>(endpoints.access.grantable, {
    params: companyId ? { companyId } : undefined,
  })
}

export function fetchDashboardGrants(dashboardId: string, companyId?: string): Promise<DashboardGrants> {
  return get<DashboardGrants>(endpoints.access.grants(dashboardId), {
    params: companyId ? { companyId } : undefined,
  })
}

export function listShareablePeople(dashboardId: string): Promise<UserOption[]> {
  return get<UserOption[]>(endpoints.access.people(dashboardId))
}

export async function grantUserAccess(dashboardId: string, userId: string, level: AccessLevel): Promise<unknown> {
  return put(endpoints.access.user(dashboardId, userId), { levelId: await dashboardLevelId(level) })
}

export function revokeUserAccess(dashboardId: string, userId: string): Promise<unknown> {
  return del(endpoints.access.user(dashboardId, userId))
}

export async function grantGroupAccess(dashboardId: string, groupId: string, level: AccessLevel): Promise<unknown> {
  return put(endpoints.access.group(dashboardId, groupId), { levelId: await dashboardLevelId(level) })
}

export function revokeGroupAccess(dashboardId: string, groupId: string): Promise<unknown> {
  return del(endpoints.access.group(dashboardId, groupId))
}

export function fetchGroupDashboards(groupId: string): Promise<GroupDashboards> {
  return get<GroupDashboards>(endpoints.access.groupDashboards(groupId))
}

export function fetchHealth(): Promise<HealthStatus> {
  return get<HealthStatus>(endpoints.health)
}
