import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bot,
  BookOpen,
  BrainCircuit,
  Building2,
  CircleCheck,
  FilePen,
  Database,
  KeyRound,
  LayoutDashboard,
  Layers,
  Home,
  Network,
  History,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCircle,
  Users,
  UsersRound,
} from 'lucide-react'
import type { AppPaths } from '@/router/paths'

import type { RoleName } from '@/types/auth'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  permission?: string
  exact?: boolean
  children?: NavItem[]
}

export interface NavGroup {
  title: string | null
  items: NavItem[]
}

type Keep = (item: NavItem) => boolean

function kept(items: NavItem[], keep: Keep): NavItem[] {
  return items
    .filter(keep)
    .map((item) => (item.children ? { ...item, children: kept(item.children, keep) } : item))
}

function visible(groups: NavGroup[], keep: Keep): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: kept(group.items, keep) }))
    .filter((group) => group.items.length > 0)
}

const permitted =
  (can: (permission: string) => boolean): Keep =>
  (item) =>
    !item.permission || can(item.permission)

const listed =
  (allowed: ReadonlySet<string>): Keep =>
  (item) =>
    allowed.has(item.path)

function lakehouse(paths: AppPaths): NavItem {
  return {
    label: 'Metadata Lakehouse',
    path: paths.metadataLakehouse,
    icon: Layers,
    permission: 'context.read',
    children: [
      { label: 'Drafts', path: paths.metadataLakehouseDrafts, icon: FilePen, permission: 'context.read' },
      { label: 'Published', path: paths.metadataLakehousePublished, icon: CircleCheck, permission: 'context.read' },
    ],
  }
}

function platformGroups(paths: AppPaths): NavGroup[] {
  return [
    {
      title: null,
      items: [
        { label: 'Overview', path: paths.overview, icon: Home, exact: true },
        { label: 'Architecture', path: paths.architecture, icon: Network },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        lakehouse(paths),
        { label: 'Data analyst', path: paths.dataAnalyst(), icon: Bot, permission: 'analyst.use' },
        { label: 'Playbooks', path: paths.playbooks(), icon: BookOpen, permission: 'playbook.read' },
        { label: 'Nexus Playbooks', path: paths.nexusPlaybooks, icon: BookOpen },
        { label: 'Agents', path: paths.agentLibrary, icon: BrainCircuit, permission: 'agent.read' },
      ],
    },
    {
      title: 'Product',
      items: [
        { label: 'Dashboards', path: paths.dashboards, icon: LayoutDashboard, permission: 'dashboard.read' },
        { label: 'Data sources', path: paths.data, icon: Database, permission: 'data.read' },
      ],
    },
    {
      title: 'Customers',
      items: [
        { label: 'Companies', path: paths.companies!, icon: Building2, permission: 'company.read' },
        { label: 'Users', path: paths.users, icon: Users, permission: 'user.read' },
      ],
    },
    {
      title: 'Access',
      items: [
        { label: 'Roles', path: paths.roles!, icon: ShieldCheck, permission: 'role.read' },
        { label: 'Groups', path: paths.groups, icon: UsersRound, permission: 'group.read' },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Audit log', path: paths.audit, icon: Activity },
        { label: 'Deleted items', path: paths.deletedItems, icon: Trash2, permission: 'delete.permanent' },
      ],
    },
  ]
}

function workspaceGroups(paths: AppPaths, role?: RoleName): NavGroup[] {
  return [
    {
      title: null,
      items: [
        { label: 'Overview', path: paths.overview, icon: Home, exact: true },
        { label: 'Architecture', path: paths.architecture, icon: Network },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        lakehouse(paths),
        { label: 'Data analyst', path: paths.dataAnalyst(), icon: Bot, permission: 'analyst.use' },
        { label: 'Playbooks', path: paths.playbooks(), icon: BookOpen, permission: 'playbook.read' },
        { label: 'Nexus Playbooks', path: paths.nexusPlaybooks, icon: BookOpen },
        { label: 'Agents', path: paths.agentLibrary, icon: BrainCircuit, permission: 'agent.read' },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Dashboards', path: paths.dashboards, icon: LayoutDashboard, permission: 'dashboard.read' },
        { label: 'Data sources', path: paths.data, icon: Database, permission: 'data.read' },
      ],
    },
    {
      title: 'Team',
      items: [
        { label: 'Members', path: paths.users, icon: Users, permission: 'user.read' },
        { label: 'Roles', path: paths.roles!, icon: ShieldCheck, permission: 'role.read' },
        { label: 'Groups', path: paths.groups, icon: UsersRound, permission: 'group.read' },
        { label: 'Dashboard access', path: paths.access!, icon: KeyRound, permission: 'access.read' },
      ],
    },
    {
      title: 'Activity',
      items: [
        { label: role === 'COMPANY_ADMIN' ? 'Audit log' : 'My activity', path: paths.audit, icon: History },
        { label: 'Deleted items', path: paths.deletedItems, icon: Trash2, permission: 'delete.permanent' },
      ],
    },
  ]
}

function groupsFor(paths: AppPaths, role?: RoleName): NavGroup[] {
  return paths.shell === 'platform' ? platformGroups(paths) : workspaceGroups(paths, role)
}

function accountItems(paths: AppPaths): NavItem[] {
  const items: NavItem[] =
    paths.shell === 'platform'
      ? [
          { label: 'Settings', path: paths.settings, icon: Settings },
          { label: 'Your account', path: paths.profile, icon: UserCircle },
        ]
      : [
          {
            label: 'Company settings',
            path: paths.companySettings!,
            icon: SlidersHorizontal,
            permission: 'company.read',
          },
          { label: 'Your account', path: paths.profile, icon: UserCircle },
        ]
  return items.filter((item) => item.path)
}

export function navigationPaths(paths: AppPaths, can: (permission: string) => boolean, role?: RoleName): string[] {
  const found: string[] = []
  const collect = (items: NavItem[]) => {
    for (const item of items) {
      found.push(item.path)
      if (item.children) collect(item.children)
    }
  }
  for (const group of visible(groupsFor(paths, role), permitted(can))) collect(group.items)
  collect(accountItems(paths).filter(permitted(can)))
  return found
}

export function navigationWithin(paths: AppPaths, allowed: ReadonlySet<string>, role?: RoleName): NavGroup[] {
  return visible(groupsFor(paths, role), listed(allowed))
}

export function accountMenuWithin(paths: AppPaths, allowed: ReadonlySet<string>): NavItem[] {
  return accountItems(paths).filter(listed(allowed))
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.path
  return pathname === item.path || pathname.startsWith(`${item.path}/`)
}
