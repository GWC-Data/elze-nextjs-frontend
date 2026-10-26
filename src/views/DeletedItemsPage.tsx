'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import { Building2, GitBranch, Layers, RotateCcw, ShieldCheck, Trash2, User, UsersRound } from 'lucide-react'
import { listDeletedItems, purgeDeletedItem, restoreDeletedItem } from '@/api/deletedItems.api'
import { listCompanyOptions } from '@/api/platform.api'
import { useAsync } from '@/hooks/useAsync'
import { usePaths } from '@/hooks/usePaths'
import { useServerList } from '@/hooks/useServerList'
import { Page, PageHeader, Section } from '@/components/common/Page'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Hint } from '@/components/common/Hint'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { DeletedItem, DeletedItemType } from '@/types/admin'

const ALL = '__all__'

const TYPES: Record<DeletedItemType, { label: string; plural: string; icon: ComponentType<{ className?: string }> }> = {
  user: { label: 'Account', plural: 'Accounts', icon: User },
  group: { label: 'Group', plural: 'Groups', icon: UsersRound },
  role: { label: 'Role', plural: 'Roles', icon: ShieldCheck },
  company: { label: 'Company', plural: 'Companies', icon: Building2 },
  context: { label: 'Context', plural: 'Contexts', icon: Layers },
  version: { label: 'Published version', plural: 'Published versions', icon: GitBranch },
}

const COMES_BACK: Record<DeletedItemType, string> = {
  user: 'It comes back deactivated, with its role and group memberships. Reactivate it to let them sign in again. An account that never chose a password comes back invited instead.',
  group: 'It comes back paused, with its members and the contexts shared with it. Resume it to grant that access again.',
  role: 'It comes back with its permissions. Nobody holds it until you give it to someone.',
  company: 'It comes back suspended, with the groups, roles and contexts deleted together with it. Its deleted accounts then appear here to be recovered one by one.',
  context: 'It comes back with its dataset selection, published versions and sharing.',
  version: 'It is listed with the published versions of its context again.',
}

const GOES_WITH_IT: Partial<Record<DeletedItemType, string>> = {
  company: 'Everything inside it goes too: its accounts, groups, roles and contexts.',
  context: 'Its dataset selection, facts and every published version go too.',
  group: 'Its membership and the access it carried go too.',
}

function locationOf(item: DeletedItem, platform: boolean): string {
  switch (item.type) {
    case 'user':
      return platform ? 'Users' : 'Team › Members'
    case 'group':
      return platform ? 'Groups' : 'Team › Groups'
    case 'role':
      return platform ? 'Roles' : 'Team › Roles'
    case 'company':
      return 'Companies'
    case 'context':
      return 'Metadata Lakehouse'
    case 'version':
      return `Metadata Lakehouse › ${item.parent?.name ?? 'its context'}`
  }
}

function deleterOf(item: DeletedItem): string {
  if (!item.deletedBy) return 'Unknown'
  return item.deletedBy.name ?? 'A removed account'
}

export default function DeletedItemsPage() {
  const paths = usePaths()
  const platform = paths.shell === 'platform'

  const [typeFilter, setTypeFilter] = useState<string>(ALL)
  const [companyFilter, setCompanyFilter] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<DeletedItem | null>(null)
  const [purging, setPurging] = useState<DeletedItem | null>(null)
  const [pending, setPending] = useState(false)

  const companies = useAsync(() => (platform ? listCompanyOptions() : Promise.resolve([])), [platform])

  const list = useServerList(
    listDeletedItems,
    { page: 1, pageSize: 15, sort: 'deletedAt', dir: 'desc' },
    {
      type: typeFilter === ALL ? undefined : (typeFilter as DeletedItemType),
      companyId: companyFilter ?? undefined,
    }
  )

  const confirmRestore = async () => {
    if (!restoring) return
    setPending(true)
    try {
      await restoreDeletedItem(restoring)
      notify.success(`${restoring.name} was recovered.`, `It is back in ${locationOf(restoring, platform)}.`)
      setRestoring(null)
      list.reload()
    } catch (err) {
      notify.failure(`recover ${restoring.name}`, err)
    } finally {
      setPending(false)
    }
  }

  const confirmPurge = async () => {
    if (!purging) return
    setPending(true)
    try {
      await purgeDeletedItem(purging)
      notify.success(`${purging.name} was permanently deleted.`)
      setPurging(null)
      list.reload()
    } catch (err) {
      notify.failure(`permanently delete ${purging.name}`, err)
    } finally {
      setPending(false)
    }
  }

  const typeOptions = (Object.keys(TYPES) as DeletedItemType[]).filter((type) => platform || type !== 'company')

  const columns: ColumnDef<DeletedItem>[] = [
    {
      key: 'name',
      header: 'Item',
      serverSort: 'name',
      render: (item) => {
        const Icon = TYPES[item.type].icon
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{item.name}</p>
              {item.detail && <p className="truncate text-xs text-muted-foreground">{item.detail}</p>}
            </div>
          </div>
        )
      },
    },
    {
      key: 'type',
      header: 'Type',
      width: 'w-36',
      serverSort: 'type',
      render: (item) => <span className="text-sm">{TYPES[item.type].label}</span>,
    },
    {
      key: 'from',
      header: 'Deleted from',
      secondary: true,
      serverSort: platform ? 'company' : undefined,
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{locationOf(item, platform)}</p>
          {platform && (
            <p className="truncate text-xs text-muted-foreground">
              {item.type === 'company' ? 'Platform' : (item.companyName ?? 'Platform account')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'deletedBy',
      header: 'Deleted by',
      width: 'w-40',
      secondary: true,
      serverSort: 'deletedBy',
      render: (item) => <span className="truncate text-sm">{deleterOf(item)}</span>,
    },
    {
      key: 'deletedAt',
      header: 'Deleted',
      width: 'w-36',
      serverSort: 'deletedAt',
      render: (item) => (
        <span className="text-sm text-muted-foreground" title={formatDateTime(item.deletedAt)}>
          {formatRelativeTime(item.deletedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: 'w-56',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => setRestoring(item)}>
            <RotateCcw aria-hidden />
            Recover
          </Button>
          <Hint label="Delete permanently">
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete ${item.name} permanently`}
              onClick={() => setPurging(item)}
            >
              <Trash2 aria-hidden />
            </Button>
          </Hint>
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Deleted items"
        description={
          platform
            ? 'Everything deleted across the platform, with who deleted it and when. Recover an item to put it back where it was, or delete it permanently.'
            : 'Everything deleted in your company, with who deleted it and when. Recover an item to put it back where it was, or delete it permanently.'
        }
      />

      <Section flush>
        <DataTable
          data={list.error ? null : (list.data?.items ?? null)}
          columns={columns}
          keyOf={(item) => `${item.type}:${item.id}`}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          searchPlaceholder="Search by name, account email, context or who deleted it…"
          searchClassName="sm:w-auto sm:max-w-xl sm:flex-1 sm:basis-80"
          server={{
            total: list.data?.total ?? 0,
            query: list.query,
            onQueryChange: list.setQuery,
            narrowed: list.narrowed,
          }}
          empty={{
            title: 'Nothing has been deleted',
            body: 'Deleted items stay here until they are recovered or deleted permanently.',
          }}
          toolbar={
            <>
              {platform && (
                <Select
                  value={companyFilter === null ? ALL : String(companyFilter)}
                  onValueChange={(value) => setCompanyFilter(value === ALL ? null : value)}
                >
                  <SelectTrigger size="lg" className="w-44" aria-label="Filter by company">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All companies</SelectItem>
                    {(companies.data ?? []).map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger size="lg" className="w-48" aria-label="Filter by type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All types</SelectItem>
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {TYPES[type].plural}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />
      </Section>

      <ConfirmDialog
        open={restoring !== null}
        onOpenChange={(open) => !open && !pending && setRestoring(null)}
        title={restoring ? `Recover ${restoring.name}?` : ''}
        body={
          restoring ? (
            <>
              It goes back to <span className="font-medium text-foreground">{locationOf(restoring, platform)}</span>
              {platform && restoring.companyName && restoring.type !== 'company' ? ` in ${restoring.companyName}` : ''}
              , where it was deleted from by {deleterOf(restoring)} on {formatDateTime(restoring.deletedAt)}.
            </>
          ) : (
            ''
          )
        }
        consequence={restoring ? COMES_BACK[restoring.type] : undefined}
        confirmLabel="Recover"
        pending={pending}
        onConfirm={() => void confirmRestore()}
      />

      <ConfirmDialog
        open={purging !== null}
        onOpenChange={(open) => !open && !pending && setPurging(null)}
        title={purging ? `Delete ${purging.name} permanently?` : ''}
        body={
          purging
            ? `${TYPES[purging.type].label} deleted from ${locationOf(purging, platform)} by ${deleterOf(purging)} on ${formatDateTime(purging.deletedAt)}. ${GOES_WITH_IT[purging.type] ?? ''}`
            : ''
        }
        consequence="A permanent delete is final. It is erased from the database and nobody can recover it."
        confirmLabel="Delete permanently"
        destructive
        pending={pending}
        onConfirm={() => void confirmPurge()}
      />
    </Page>
  )
}
