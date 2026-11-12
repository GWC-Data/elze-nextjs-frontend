'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from '@/lib/router'
import {
  Building2,
  Check,
  CalendarDays,
  Loader2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react'
import {
  deleteGroup,
  fetchGroup,
  fetchGroupDashboards,
  fetchGroupMembers,
  grantGroupAccess,
  listAccessLevels,
  listUserOptions,
  revokeGroupAccess,
  updateGroup,
} from '@/api/workspace.api'
import { useAsync } from '@/hooks/useAsync'
import { usePaths } from '@/hooks/usePaths'
import { useAuth } from '@/context/authContext'
import { Page, PageHeader } from '@/components/common/Page'
import { AccessLevelBadge, StatusBadge } from '@/components/common/Badges'
import { GrantActionsMenu } from '@/components/common/GrantActionsMenu'
import { GrantPicker } from '@/components/common/people/GrantPicker'
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog'
import { TextField } from '@/components/common/Fields'
import { CardGridSkeleton, EmptyState, ErrorState, InlineLoading, NotFoundState } from '@/components/common/States'
import { GroupContexts } from '@/components/common/groups/GroupContexts'
import { GroupAvatar, GroupStatusPill, memberLabel } from '@/components/common/groups/GroupParts'
import { PersonAvatar } from '@/components/common/metadata-lakehouse/ContextCardParts'
import { SHOW_ANALYTICS } from '@/constants/sections'
import { ACCESS_LEVEL_LABELS } from '@/constants/labels'
import { notify } from '@/lib/notify'
import { cn, isUuid } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AccessLevel } from '@/types/auth'
import type { GroupDetail, GroupMember, UserOption } from '@/types/admin'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function memberName(member: Pick<GroupMember, 'displayName' | 'username'>): string {
  return member.displayName || member.username
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground tabular-nums">
      {value}
    </span>
  )
}

export default function GroupPage() {
  const { groupId = '' } = useParams()
  const { can, user: me } = useAuth()
  const paths = usePaths()
  const navigate = useNavigate()
  const isPlatform = me?.companyId === null
  const editable = can('group.update')

  const valid = isUuid(groupId)
  const group = useAsync(
    () => (valid ? fetchGroup(groupId) : Promise.reject(new Error('invalid id'))),
    [groupId, valid]
  )
  const members = useAsync(() => (valid ? fetchGroupMembers(groupId) : Promise.resolve([])), [groupId, valid])

  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [toggling, setToggling] = useState(false)

  if (!valid) {
    return (
      <Page>
        <NotFoundState detail="That is not a valid group address." backTo={paths.groups} />
      </Page>
    )
  }

  if (group.error) {
    return (
      <Page>
        <PageHeader title="Group" crumbs={[{ label: 'Groups', to: paths.groups }, { label: 'Not available' }]} />
        <ErrorState error={group.error} title="Unable to load this group" onRetry={group.reload} />
      </Page>
    )
  }

  if (group.loading || !group.data) {
    return (
      <Page>
        <PageHeader title="Loading group…" crumbs={[{ label: 'Groups', to: paths.groups }, { label: '…' }]} />
        <CardGridSkeleton count={2} />
      </Page>
    )
  }

  const record = group.data
  const refresh = () => {
    group.reload()
    members.reload()
  }

  const toggleActive = async () => {
    setToggling(true)
    try {
      await updateGroup(record.id, { active: !record.active })
      notify.success(
        record.active ? `${record.name} is paused.` : `${record.name} is active again.`,
        record.active ? 'Its members keep their own access, but not what the group gives them.' : undefined
      )
      group.reload()
    } catch (err) {
      notify.failure(record.active ? 'pause this group' : 'resume this group', err)
    } finally {
      setToggling(false)
    }
  }

  const confirmDelete = async (permanent: boolean) => {
    setDeletePending(true)
    try {
      await deleteGroup(record.id, { permanent })
      notify.success(`${record.name} was ${permanent ? 'permanently deleted' : 'deleted'}.`)
      navigate(paths.groups)
    } catch (err) {
      notify.failure('delete this group', err)
      setDeletePending(false)
    }
  }

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: 'Groups', to: paths.groups }, { label: record.name }]}
        icon={<GroupAvatar name={record.name} size="lg" />}
        title={record.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <GroupStatusPill active={record.active} />
            {isPlatform ? (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Building2 className="size-3" aria-hidden />
                {record.companyName}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3" aria-hidden />
              Created {formatDate(record.createdAt)}
            </span>
          </span>
        }
        actions={
          <>
            {editable ? (
              <Button variant="outline" onClick={() => void toggleActive()} disabled={toggling}>
                {toggling ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : record.active ? (
                  <Pause aria-hidden />
                ) : (
                  <Play aria-hidden />
                )}
                {record.active ? 'Pause group' : 'Resume group'}
              </Button>
            ) : null}
            {editable || can('group.delete') ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label={`Options for ${record.name}`}>
                    <MoreHorizontal aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {editable ? (
                    <DropdownMenuItem onSelect={() => setRenaming(true)}>
                      <Pencil aria-hidden />
                      Rename…
                    </DropdownMenuItem>
                  ) : null}
                  {can('group.delete') ? (
                    <>
                      {editable ? <DropdownMenuSeparator /> : null}
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                        <Trash2 aria-hidden />
                        Delete group
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        }
      />

      {!record.active ? (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          <Pause className="size-4 shrink-0" aria-hidden />
          Paused: members do not get this group&rsquo;s access until you resume it.
        </div>
      ) : null}

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            Members
            <CountBadge value={record.memberCount} />
          </TabsTrigger>
          {can('context.read') ? (
            <TabsTrigger value="contexts">
              Shared contexts
              <CountBadge value={record.contextCount ?? 0} />
            </TabsTrigger>
          ) : null}
          {SHOW_ANALYTICS ? <TabsTrigger value="dashboards">Dashboards</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <MembersPanel
            group={record}
            members={members.data ?? null}
            loading={members.loading}
            error={members.error}
            onRetry={members.reload}
            editable={editable}
            isPlatform={isPlatform}
            onChanged={refresh}
          />
        </TabsContent>

        {can('context.read') ? (
          <TabsContent value="contexts" className="mt-4">
            <GroupContexts group={record} onChanged={group.reload} />
          </TabsContent>
        ) : null}

        {SHOW_ANALYTICS ? (
          <TabsContent value="dashboards" className="mt-4">
            <GroupDashboards groupId={record.id} />
          </TabsContent>
        ) : null}
      </Tabs>

      {renaming ? (
        <RenameDialog
          group={record}
          onClose={() => setRenaming(false)}
          onRenamed={() => {
            setRenaming(false)
            group.reload()
          }}
        />
      ) : null}

      <DeleteConfirmDialog
        open={deleting}
        onOpenChange={(open) => !open && setDeleting(false)}
        title={`Delete ${record.name}?`}
        body="The group is removed from every list and grants nothing any more."
        confirmLabel="Delete group"
        pending={deletePending}
        onConfirm={(permanent) => void confirmDelete(permanent)}
      />
    </Page>
  )
}

function MembersPanel({
  group,
  members,
  loading,
  error,
  onRetry,
  editable,
  isPlatform,
  onChanged,
}: {
  group: GroupDetail
  members: GroupMember[] | null
  loading: boolean
  error: unknown
  onRetry: () => void
  editable: boolean
  isPlatform: boolean
  onChanged: () => void
}) {
  const people = useAsync(
    () => (editable ? listUserOptions(isPlatform ? group.companyId : undefined) : Promise.resolve([])),
    [editable, isPlatform, group.companyId]
  )
  const [picked, setPicked] = useState<UserOption[]>([])
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const currentIds = (members ?? []).map((m) => m.id)
  const candidates = (people.data ?? []).filter((p) => !currentIds.includes(p.id))

  const toggle = (person: UserOption) =>
    setPicked((current) =>
      current.some((p) => p.id === person.id) ? current.filter((p) => p.id !== person.id) : [...current, person]
    )

  const add = async () => {
    if (picked.length === 0) return
    setAdding(true)
    try {
      await updateGroup(group.id, { userIds: [...currentIds, ...picked.map((p) => p.id)] })
      notify.success(
        picked.length === 1
          ? `${picked[0].username} was added to ${group.name}.`
          : `${picked.length} people were added to ${group.name}.`
      )
      setPicked([])
      onChanged()
    } catch (err) {
      notify.failure('add those people', err)
    } finally {
      setAdding(false)
    }
  }

  const remove = async (member: GroupMember) => {
    setRemovingId(member.id)
    try {
      await updateGroup(group.id, { userIds: currentIds.filter((id) => id !== member.id) })
      notify.success(`${memberName(member)} was removed from ${group.name}.`)
      onChanged()
    } catch (err) {
      notify.failure('remove that member', err)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {editable ? (
        <div className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-2 sm:flex-row sm:items-start">
          <PeoplePicker
            options={candidates}
            loading={people.loading}
            selected={picked}
            onToggle={toggle}
            disabled={adding}
          />
          <Button onClick={() => void add()} disabled={picked.length === 0 || adding} className="min-w-24 sm:mt-0.5">
            {adding ? <Loader2 className="animate-spin" aria-hidden /> : <UserPlus aria-hidden />}
            {picked.length > 1 ? `Add ${picked.length}` : 'Add'}
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card">
        {error ? (
          <ErrorState error={error} title="Unable to load the members" onRetry={onRetry} compact />
        ) : loading && !members ? (
          <InlineLoading label="Loading members…" />
        ) : (members ?? []).length === 0 ? (
          <EmptyState
            title="No members yet"
            body={editable ? 'Add people above. Everything shared with the group reaches them at once.' : undefined}
            icon={UsersRound}
            compact
          />
        ) : (
          <>
            <div className="border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
              {memberLabel((members ?? []).length)}
            </div>
            <ul className="divide-y">
              {(members ?? []).map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                  <PersonAvatar name={memberName(member)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{memberName(member)}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {member.displayName ? `${member.username} · ${member.email}` : member.email}
                    </span>
                  </span>
                  {member.status !== 'active' ? <StatusBadge status={member.status} /> : null}
                  {editable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={removingId === member.id}
                      onClick={() => void remove(member)}
                      aria-label={`Remove ${memberName(member)} from ${group.name}`}
                    >
                      {removingId === member.id ? (
                        <Loader2 className="animate-spin" aria-hidden />
                      ) : (
                        <X aria-hidden />
                      )}
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

function PeoplePicker({
  options,
  loading,
  selected,
  onToggle,
  disabled,
}: {
  options: UserOption[]
  loading: boolean
  selected: UserOption[]
  onToggle: (person: UserOption) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const isPicked = (person: UserOption) => selected.some((p) => p.id === person.id)
  const nothingLeft = !loading && options.length === 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="flex min-h-10 min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-lg bg-background px-2 py-1.5">
          {selected.map((person) => (
            <span
              key={person.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/60 py-0.5 pr-1 pl-0.5 text-xs font-medium"
            >
              <PersonAvatar name={person.username} className="size-5 text-[9px]" />
              <span className="max-w-40 truncate">{person.username}</span>
              <button
                type="button"
                aria-label={`Remove ${person.username} from the selection`}
                disabled={disabled}
                onClick={() => onToggle(person)}
                className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              aria-label="Add people to the group"
              disabled={disabled}
              className="flex h-7 min-w-36 flex-1 items-center gap-2 rounded-md px-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
            >
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate text-muted-foreground">
                {loading
                  ? 'Loading people…'
                  : nothingLeft && selected.length === 0
                    ? 'Everyone is already a member'
                    : selected.length
                      ? 'Add more…'
                      : 'Add people…'}
              </span>
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-[var(--radix-popper-anchor-width)] min-w-72 p-0">
        <Command>
          <CommandInput placeholder="Search by username or email…" />
          <CommandList className="max-h-72">
            <CommandEmpty>{loading ? 'Loading people…' : 'Nobody matches that.'}</CommandEmpty>
            {options.length ? (
              <CommandGroup heading="People">
                {options.map((person) => {
                  const on = isPicked(person)
                  return (
                    <CommandItem
                      key={person.id}
                      value={`${person.username} ${person.email} ${person.id}`}
                      onSelect={() => onToggle(person)}
                      className="gap-2.5"
                      aria-selected={on}
                    >
                      <PersonAvatar name={person.username} className="size-7 text-[10px]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{person.username}</span>
                        <span className="block truncate text-xs text-muted-foreground">{person.email}</span>
                      </span>
                      <span
                        className={cn(
                          'grid size-4 shrink-0 place-items-center rounded border',
                          on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                        )}
                        aria-hidden
                      >
                        {on ? <Check className="size-3" /> : null}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ) : null}
          </CommandList>
          {selected.length ? (
            <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
              <span>{selected.length} selected</span>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function RenameDialog({
  group,
  onClose,
  onRenamed,
}: {
  group: GroupDetail
  onClose: () => void
  onRenamed: () => void
}) {
  const [name, setName] = useState(group.name)
  const [pending, setPending] = useState(false)
  const changed = name.trim().length > 0 && name.trim() !== group.name

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!changed || pending) return
    setPending(true)
    try {
      await updateGroup(group.id, { name: name.trim() })
      notify.success(`The group is now called ${name.trim()}.`)
      onRenamed()
    } catch (err) {
      notify.failure('rename this group', err)
      setPending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename group</DialogTitle>
          <DialogDescription className="sr-only">Choose a new name for {group.name}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label="Name" value={name} onChange={setName} autoFocus disabled={pending} required />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!changed || pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Save name
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GroupDashboards({ groupId }: { groupId: string }) {
  const { can } = useAuth()
  const mayGrant = can('access.grant')
  const mayRevoke = can('access.revoke')

  const access = useAsync(() => fetchGroupDashboards(groupId), [groupId])
  const levels = useAsync(() => listAccessLevels(), [])
  const [pending, setPending] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const grant = async (dashboardId: string, level: AccessLevel) => {
    setPending(true)
    try {
      await grantGroupAccess(dashboardId, groupId, level)
      notify.success('Access given to the group.', 'Every active member has it now.')
      access.reload()
    } catch (err) {
      notify.failure('give that access', err)
      throw err
    } finally {
      setPending(false)
    }
  }

  const revoke = async (dashboardId: string, title: string) => {
    setPendingId(dashboardId)
    try {
      await revokeGroupAccess(dashboardId, groupId)
      notify.success(`The group no longer has ${title}.`)
      access.reload()
    } catch (err) {
      notify.failure('remove that access', err)
    } finally {
      setPendingId(null)
    }
  }

  const changeLevel = async (dashboardId: string, title: string, level: AccessLevel) => {
    setPendingId(dashboardId)
    try {
      await grantGroupAccess(dashboardId, groupId, level)
      notify.success(`The group now ${ACCESS_LEVEL_LABELS[level].toLowerCase()} ${title}.`)
      access.reload()
    } catch (err) {
      notify.failure('change that permission', err)
    } finally {
      setPendingId(null)
    }
  }

  const held = access.data?.held ?? []

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {mayGrant ? <GrantPicker dashboards={access.data?.available ?? []} disabled={pending} onGrant={grant} /> : null}
      {access.error ? (
        <ErrorState error={access.error} title="Unable to load access" onRetry={access.reload} compact />
      ) : access.loading ? (
        <InlineLoading label="Loading access…" />
      ) : held.length === 0 ? (
        <EmptyState title="This group has no dashboards" compact />
      ) : (
        <ul className="divide-y">
          {held.map((dashboard) => {
            const title = dashboard.title || dashboard.id
            return (
              <li key={dashboard.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 truncate text-sm font-medium text-foreground">{title}</span>
                <span className="flex items-center gap-2">
                  <AccessLevelBadge level={dashboard.level} />
                  <GrantActionsMenu
                    holderName="this group"
                    level={dashboard.level}
                    levels={levels.data ?? undefined}
                    mayChange={mayGrant}
                    mayRemove={mayRevoke}
                    pending={pendingId === dashboard.id}
                    onChangeLevel={(level) => void changeLevel(dashboard.id, title, level)}
                    onRemove={() => void revoke(dashboard.id, title)}
                  />
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
