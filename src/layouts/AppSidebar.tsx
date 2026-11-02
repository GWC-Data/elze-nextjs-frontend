import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronsUpDown, Coins, LogOut } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from '@/lib/router'
import { useAuth } from '@/context/authContext'
import { usePaths } from '@/hooks/usePaths'
import { accountMenuWithin, isNavItemActive, navigationWithin } from '@/constants/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { ElzeMark } from '@/components/common/ElzeMark'
import { Hint } from '@/components/common/Hint'
import { LOW_BALANCE } from '@/constants/credits'
import { useCredits } from '@/hooks/useCredits'
import { creditLabel, formatCredits } from '@/lib/format'
import type { CreditStatus } from '@/types/credits'

export interface AppSidebarProps {
  navigation: string[]
  onNavigate?: () => void
}

const COLLAPSED_KEY = 'elze.sidebar.collapsedSections'

function readCollapsed(): Set<string> {
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function writeCollapsed(value: Set<string>) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...value]))
  } catch {
    return
  }
}

function initials(name: string): string {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function AppSidebar({ navigation, onNavigate }: AppSidebarProps) {
  const { user, signOut } = useAuth()
  const paths = usePaths()
  const { pathname } = useLocation()
  const { setOpenMobile, isMobile, state } = useSidebar()
  const [collapsed, setCollapsed] = useState<Set<string>>(readCollapsed)
  const [signingOut, setSigningOut] = useState(false)

  const allowed = useMemo(() => new Set(navigation), [navigation])
  const groups = navigationWithin(paths, allowed, user?.role)
  const accountItems = accountMenuWithin(paths, allowed)
  const navigate = useNavigate()
  const credits = useCredits()
  const platform = paths.shell === 'platform'
  const iconRail = state === 'collapsed' && !isMobile


  const isOpen = (key: string) => iconRail || !collapsed.has(key)
  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      writeCollapsed(next)
      return next
    })
  }

  const handleNavClick = () => {
    onNavigate?.()
    if (isMobile) setOpenMobile(false)
  }

  const name = user ? user.displayName || user.username : ''

  return (
    <Sidebar collapsible="icon" aria-label={platform ? 'Platform console' : 'Workspace'}>
      <SidebarHeader className="border-b border-sidebar-border px-3.5 py-3">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2.5 overflow-hidden group-data-[collapsible=icon]:hidden">
            <ElzeMark className="shadow-xs" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                Elze Analytics
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {platform ? 'Platform console' : user?.companyName || 'Workspace'}
              </span>
            </div>
          </div>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group, groupIdx) => {
          const key = group.title ?? `group-${groupIdx}`
          const open = !group.title || isOpen(key)
          return (
            <SidebarGroup key={key}>
              {group.title ? <SectionTitle title={group.title} open={open} onToggle={() => toggle(key)} /> : null}
              {open ? (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const active = isNavItemActive(item, pathname)
                      const Icon = item.icon
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                            <NavLink
                              to={item.path}
                              onClick={handleNavClick}
                              aria-current={active ? 'page' : undefined}
                            >
                              <Icon className="size-4 shrink-0" aria-hidden />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuButton>
                          {item.children?.length ? (
                            <SidebarMenuSub>
                              {item.children.map((child) => {
                                const childActive = isNavItemActive(child, pathname)
                                const ChildIcon = child.icon
                                return (
                                  <SidebarMenuSubItem key={child.path}>
                                    <SidebarMenuSubButton asChild isActive={childActive}>
                                      <NavLink
                                        to={child.path}
                                        onClick={handleNavClick}
                                        aria-current={childActive ? 'page' : undefined}
                                      >
                                        <ChildIcon className="size-3.5 shrink-0" aria-hidden />
                                        <span>{child.label}</span>
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                )
                              })}
                            </SidebarMenuSub>
                          ) : null}
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              ) : null}
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="gap-1 border-t border-sidebar-border p-2">
        <SidebarMenu>
          {credits.status && !credits.status.exempt ? (
            <SidebarMenuItem className="mb-1 group-data-[collapsible=icon]:mb-0">
              <CreditBalance
                status={credits.status}
                to={allowed.has(paths.credits) ? paths.credits : null}
                active={isNavItemActive({ label: 'Credits', path: paths.credits, icon: Coins }, pathname)}
                onNavigate={handleNavClick}
              />
            </SidebarMenuItem>
          ) : null}

          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip={name}
                    aria-label={`Account: ${name}`}
                    className="data-[state=open]:bg-sidebar-accent"
                  >
                    <Avatar className="size-8 after:hidden">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="grid min-w-0 flex-1 text-left leading-tight">
                      <span className="truncate text-sm font-semibold">{name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </span>
                    <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  sideOffset={6}
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-48"
                >
                  {accountItems.map((item) => (
                    <DropdownMenuItem
                      key={item.path}
                      onSelect={() => {
                        navigate(item.path)
                        onNavigate?.()
                      }}
                    >
                      <item.icon aria-hidden />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  {accountItems.length > 0 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={signingOut}
                    onSelect={(event) => {
                      event.preventDefault()
                      setSigningOut(true)
                      void signOut().finally(() => setSigningOut(false))
                    }}
                  >
                    <LogOut aria-hidden />
                    {signingOut ? 'Signing out…' : 'Sign out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : null}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

type CreditState = 'ok' | 'low' | 'empty'

const CREDIT_TONES: Record<CreditState, { icon: string; value: string; pill: string; bar: string; dot: string }> = {
  ok: {
    icon: 'bg-primary/10 text-primary',
    value: 'text-sidebar-foreground',
    pill: '',
    bar: 'bg-primary',
    dot: '',
  },
  low: {
    icon: 'bg-warning/20 text-warning-foreground dark:text-warning',
    value: 'text-warning-foreground dark:text-warning',
    pill: 'bg-warning/15 text-warning-foreground dark:text-warning',
    bar: 'bg-warning',
    dot: 'bg-warning',
  },
  empty: {
    icon: 'bg-destructive/10 text-destructive',
    value: 'text-destructive',
    pill: 'bg-destructive/10 text-destructive',
    bar: 'bg-destructive',
    dot: 'bg-destructive',
  },
}

function CreditBalance({
  status,
  to,
  active,
  onNavigate,
}: {
  status: CreditStatus
  to: string | null
  active: boolean
  onNavigate: () => void
}) {
  const available = status.available ?? 0
  const state: CreditState = available <= 0 ? 'empty' : available < LOW_BALANCE ? 'low' : 'ok'
  const tone = CREDIT_TONES[state]
  const limit = status.limit
  const share = limit === null ? 0 : limit === 0 ? 100 : Math.min(100, (status.used / limit) * 100)

  const details = (
    <div className="space-y-0.5 text-xs">
      <p className="font-medium">{creditLabel(available)} available</p>
      <p className="opacity-80">Company balance {formatCredits(status.balance)}</p>
      <p className="opacity-80">
        {limit === null
          ? `You have used ${formatCredits(status.used)}`
          : `You have used ${formatCredits(status.used)} of your ${formatCredits(limit)} limit`}
      </p>
    </div>
  )

  const body = (
    <>
      <span className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
        <span className={cn('relative grid size-8 shrink-0 place-items-center rounded-full', tone.icon)}>
          <Coins className="size-4" aria-hidden />
          {state !== 'ok' && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 hidden size-2.5 rounded-full ring-2 ring-sidebar group-data-[collapsible=icon]:block',
                tone.dot
              )}
              aria-hidden
            />
          )}
        </span>
        <span className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            Credits
            {state !== 'ok' && (
              <span className={cn('rounded-full px-1.5 py-px text-[10px] font-semibold', tone.pill)}>
                {state === 'empty' ? 'Empty' : 'Low'}
              </span>
            )}
          </span>
          <span className="mt-0.5 flex items-baseline gap-1">
            <span className={cn('text-[15px] font-semibold tabular-nums', tone.value)}>{formatCredits(available)}</span>
            <span className="text-xs text-muted-foreground">available</span>
          </span>
        </span>
        {to && (
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground/70 transition-transform group-hover/credits:translate-x-0.5 group-data-[collapsible=icon]:hidden"
            aria-hidden
          />
        )}
      </span>
      {limit !== null && (
        <span className="mt-2.5 block group-data-[collapsible=icon]:hidden">
          <span className="block h-1.5 overflow-hidden rounded-full bg-sidebar-border">
            <span className={cn('block h-full rounded-full', tone.bar)} style={{ width: `${share}%` }} />
          </span>
          <span className="mt-1.5 flex justify-between gap-2 text-[11px] tabular-nums text-muted-foreground">
            <span>Your limit</span>
            <span>
              {formatCredits(status.used)} of {formatCredits(limit)} used
            </span>
          </span>
        </span>
      )}
    </>
  )

  const className = cn(
    'group/credits block w-full rounded-xl border border-sidebar-border bg-card p-2.5 text-left shadow-xs transition-colors',
    'group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none',
    to && 'hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
    active && 'border-primary/30 bg-sidebar-accent'
  )
  const label = `Credits: ${creditLabel(available)} available`

  return (
    <Hint label={details} side="right">
      {to ? (
        <Link
          to={to}
          onClick={onNavigate}
          aria-label={label}
          aria-current={active ? 'page' : undefined}
          className={className}
        >
          {body}
        </Link>
      ) : (
        <div className={cn(className, 'cursor-default')} role="group" aria-label={label}>
          {body}
        </div>
      )}
    </Hint>
  )
}

function SectionTitle({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <SidebarGroupLabel asChild className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full cursor-pointer hover:text-sidebar-foreground"
      >
        <span className="truncate">{title}</span>
        <ChevronDown
          className={cn('ml-auto size-3.5 transition-transform duration-200', !open && '-rotate-90')}
          aria-hidden
        />
      </button>
    </SidebarGroupLabel>
  )
}
