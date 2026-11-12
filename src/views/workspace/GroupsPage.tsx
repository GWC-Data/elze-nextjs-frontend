'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from '@/lib/router'
import { Loader2, Plus, UsersRound } from 'lucide-react'
import { createGroup, listGroups } from '@/api/workspace.api'
import { listCompanyOptions } from '@/api/platform.api'
import { useAsync } from '@/hooks/useAsync'
import { usePaths } from '@/hooks/usePaths'
import { useAuth } from '@/context/authContext'
import { Page, PageHeader, Section } from '@/components/common/Page'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import { TextField } from '@/components/common/Fields'
import { GroupAvatar, GroupStatusPill } from '@/components/common/groups/GroupParts'
import { notify } from '@/lib/notify'
import { formatExact } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Group } from '@/types/admin'

const ALL = '__all__'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GroupsPage() {
  const { can, user: me } = useAuth()
  const paths = usePaths()
  const navigate = useNavigate()
  const isPlatform = me?.companyId === null

  const groups = useAsync(() => listGroups(), [])
  const [creating, setCreating] = useState(false)
  const [companyFilter, setCompanyFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)

  const all = groups.data ?? []
  const companies = [...new Map(all.map((g) => [g.companyId, g.companyName])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1])
  )
  const rows = all.filter(
    (g) =>
      (companyFilter === ALL || g.companyId === companyFilter) &&
      (statusFilter === ALL || (statusFilter === 'active') === g.active)
  )

  const columns: ColumnDef<Group>[] = [
    {
      key: 'name',
      header: 'Group',
      sortValue: (g) => g.name.toLowerCase(),
      render: (g) => (
        <div className="flex min-w-0 items-center gap-3">
          <GroupAvatar name={g.name} />
          <span className="truncate font-medium text-foreground">{g.name}</span>
        </div>
      ),
    },
    ...(isPlatform
      ? [
          {
            key: 'company',
            header: 'Company',
            secondary: true,
            sortValue: (g: Group) => g.companyName.toLowerCase(),
            render: (g: Group) => <span className="truncate text-sm text-muted-foreground">{g.companyName}</span>,
          } satisfies ColumnDef<Group>,
        ]
      : []),
    {
      key: 'members',
      header: 'Members',
      align: 'right',
      width: 'w-28',
      sortValue: (g) => g.memberCount,
      render: (g) => <span className="tabular-nums">{formatExact(g.memberCount)}</span>,
    },
    {
      key: 'contexts',
      header: 'Shared contexts',
      align: 'right',
      width: 'w-36',
      secondary: true,
      sortValue: (g) => g.contextCount ?? 0,
      render: (g) => <span className="tabular-nums">{formatExact(g.contextCount ?? 0)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: 'w-28',
      sortValue: (g) => (g.active ? 0 : 1),
      render: (g) => <GroupStatusPill active={g.active} />,
    },
    {
      key: 'created',
      header: 'Created',
      width: 'w-36',
      secondary: true,
      sortValue: (g) => g.createdAt ?? '',
      render: (g) => <span className="text-sm text-muted-foreground">{formatDate(g.createdAt)}</span>,
    },
  ]

  const newGroup = can('group.create') ? (
    <Button onClick={() => setCreating(true)}>
      <Plus aria-hidden />
      New group
    </Button>
  ) : undefined

  return (
    <Page>
      <PageHeader
        title="Groups"
        description="Teams of people who share the same contexts. Open a group to manage its members and what it can see."
        actions={newGroup}
      />

      <Section flush>
        <DataTable
          data={groups.error ? null : groups.data ? rows : null}
          columns={columns}
          keyOf={(g) => g.id}
          loading={groups.loading}
          error={groups.error}
          onRetry={groups.reload}
          onRowClick={(g) => navigate(paths.group(g.id))}
          searchPlaceholder={isPlatform ? 'Search groups or companies…' : 'Search groups…'}
          searchFilter={(g, query) => `${g.name} ${g.companyName}`.toLowerCase().includes(query.toLowerCase())}
          toolbar={
            <>
              {isPlatform && companies.length > 1 ? (
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger size="lg" className="w-44" aria-label="Filter by company">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All companies</SelectItem>
                    {companies.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="lg" className="w-36" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          empty={
            all.length === 0
              ? {
                  title: 'No groups yet',
                  body: 'Create a group, add people to it once, and share contexts with all of them at the same time.',
                  action: newGroup,
                }
              : { title: 'No matching groups', body: 'Nothing matches these filters.' }
          }
        />
      </Section>

      {creating ? (
        <CreateGroupDialog
          isPlatform={isPlatform}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false)
            navigate(paths.group(id))
          }}
        />
      ) : null}
    </Page>
  )
}

function CreateGroupDialog({
  isPlatform,
  onClose,
  onCreated,
}: {
  isPlatform: boolean
  onClose: () => void
  onCreated: (groupId: string) => void
}) {
  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [pending, setPending] = useState(false)

  const companies = useAsync(
    () => (isPlatform ? listCompanyOptions() : Promise.resolve([])),
    [isPlatform]
  )

  const ready = name.trim().length > 0 && (!isPlatform || companyId !== '')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending || !ready) return
    setPending(true)
    try {
      const group = await createGroup({
        name: name.trim(),
        companyId: isPlatform ? companyId : undefined,
      })
      notify.success(`${group.name} was created.`, 'Add members and share contexts with it next.')
      onCreated(group.id)
    } catch (err) {
      notify.failure('create that group', err)
      setPending(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3 text-left">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <UsersRound className="size-5" aria-hidden />
          </span>
          <DialogTitle>New group</DialogTitle>
          <DialogDescription className="sr-only">Name the group and choose its company.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Sales team"
            autoFocus
            disabled={pending}
            required
          />

          {isPlatform ? (
            <div className="space-y-1.5">
              <Label htmlFor="new-group-company" className="text-xs font-medium">
                Company
              </Label>
              <Select value={companyId} onValueChange={setCompanyId} disabled={pending}>
                <SelectTrigger id="new-group-company" className="w-full">
                  <SelectValue placeholder="Choose a company…" />
                </SelectTrigger>
                <SelectContent>
                  {(companies.data ?? [])
                    .filter((company) => company.active)
                    .map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !ready}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Create group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
