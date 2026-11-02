import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Lock, Pencil, RotateCcw } from 'lucide-react'
import { listCreditActivity, listCreditMembers } from '@/api/credits.api'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import { RoleBadge } from '@/components/common/Badges'
import { CreditLimitDialog, CreditRateDialog } from '@/components/common/credits/CreditDialogs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAsync } from '@/hooks/useAsync'
import { useServerList } from '@/hooks/useServerList'
import { formatCredits, formatDateTime, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RoleName } from '@/types/auth'
import type { CreditAction, CreditEntry, CreditEntryKind, CreditMember, CreditRate } from '@/types/credits'

const ALL = '__all__'

const KIND_LABELS: Record<CreditEntryKind, string> = {
  allocation: 'Credits added',
  usage: 'Used',
  refund: 'Refund',
}

function usedShare(member: CreditMember): number {
  if (member.limit === null) return 0
  if (member.limit === 0) return 100
  return Math.min(100, (member.used / member.limit) * 100)
}

export function CreditMembersTable({ companyId, onChanged }: { companyId?: string; onChanged?: () => void }) {
  const members = useAsync(() => listCreditMembers(companyId), [companyId])
  const [editing, setEditing] = useState<CreditMember | null>(null)

  const columns: ColumnDef<CreditMember>[] = [
    {
      key: 'name',
      header: 'Member',
      sortValue: (m) => m.name.toLowerCase(),
      render: (m) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{m.name}</p>
          <p className="truncate text-xs text-muted-foreground">{m.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      width: 'w-40',
      secondary: true,
      render: (m) => (m.role ? <RoleBadge role={m.role as RoleName} /> : null),
    },
    {
      key: 'used',
      header: 'Used',
      align: 'right',
      width: 'w-28',
      sortValue: (m) => m.used,
      render: (m) => <span className="text-sm font-medium tabular-nums text-foreground">{formatCredits(m.used)}</span>,
    },
    {
      key: 'restriction',
      header: 'Restriction',
      width: 'w-60',
      sortValue: (m) => (m.limit === null ? Number.POSITIVE_INFINITY : m.limit),
      render: (m) =>
        m.limit === null ? (
          <span className="text-sm text-muted-foreground">Unrestricted</span>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm tabular-nums">
              <span className="font-medium text-foreground">Restricted</span>
              <span className="text-muted-foreground">
                {' '}
                · {formatCredits(m.used)} of {formatCredits(m.limit)} used
              </span>
            </p>
            <Progress
              value={usedShare(m)}
              className={cn(usedShare(m) >= 100 && '[&>[data-slot=progress-indicator]]:bg-destructive')}
              aria-label={`${formatCredits(m.used)} of ${formatCredits(m.limit)} used`}
            />
          </div>
        ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: 'w-32',
      render: (m) => (
        <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => setEditing(m)}>
            <Lock aria-hidden />
            Restrict
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        data={members.error ? null : (members.data?.items ?? null)}
        columns={columns}
        keyOf={(m) => m.id}
        loading={members.loading}
        error={members.error}
        onRetry={members.reload}
        searchFilter={(m, query) => `${m.name} ${m.email} ${m.username}`.toLowerCase().includes(query.toLowerCase())}
        searchPlaceholder="Search members…"
        empty={{ title: 'No members yet' }}
      />
      {editing && (
        <CreditLimitDialog
          member={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null)
            members.reload()
            onChanged?.()
          }}
        />
      )}
    </>
  )
}

function EntryIcon({ entry }: { entry: CreditEntry }) {
  const Icon = entry.kind === 'usage' ? ArrowUpRight : entry.kind === 'refund' ? RotateCcw : ArrowDownLeft
  return (
    <span
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-md',
        entry.kind === 'usage' ? 'bg-muted text-muted-foreground' : 'bg-success/10 text-success'
      )}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  )
}

export function CreditActivityTable({
  companyId,
  actions,
}: {
  companyId?: string
  actions: { action: CreditAction; label: string }[]
}) {
  const [kind, setKind] = useState<string>(ALL)
  const [action, setAction] = useState<string>(ALL)

  const list = useServerList(
    listCreditActivity,
    { page: 1, pageSize: 15, sort: 'createdAt', dir: 'desc' },
    {
      companyId,
      kind: kind === ALL ? undefined : (kind as CreditEntryKind),
      action: action === ALL ? undefined : (action as CreditAction),
    }
  )

  const columns: ColumnDef<CreditEntry>[] = [
    {
      key: 'what',
      header: 'Activity',
      render: (entry) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <EntryIcon entry={entry} />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {entry.kind === 'allocation' ? KIND_LABELS.allocation : (entry.action?.label ?? KIND_LABELS[entry.kind])}
              {entry.kind === 'refund' && <span className="font-normal text-muted-foreground"> · refunded</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {entry.context?.name ?? entry.note ?? (entry.kind === 'allocation' ? 'Added to the company balance' : '')}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'who',
      header: 'By',
      width: 'w-48',
      secondary: true,
      render: (entry) => <span className="truncate text-sm">{entry.user?.name ?? '—'}</span>,
    },
    {
      key: 'credits',
      header: 'Credits',
      align: 'right',
      width: 'w-28',
      serverSort: 'credits',
      render: (entry) => (
        <span
          className={cn(
            'text-sm font-medium tabular-nums',
            entry.credits > 0 ? 'text-success' : entry.credits < 0 ? 'text-foreground' : 'text-muted-foreground',
            entry.refunded && 'line-through decoration-muted-foreground/60'
          )}
        >
          {entry.credits > 0 ? '+' : ''}
          {formatCredits(entry.credits)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      width: 'w-28',
      secondary: true,
      render: (entry) => <span className="text-sm tabular-nums text-muted-foreground">{formatCredits(entry.balanceAfter)}</span>,
    },
    {
      key: 'when',
      header: 'When',
      width: 'w-36',
      serverSort: 'createdAt',
      render: (entry) => (
        <span className="text-sm text-muted-foreground" title={formatDateTime(entry.createdAt)}>
          {formatRelativeTime(entry.createdAt)}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      data={list.error ? null : (list.data?.items ?? null)}
      columns={columns}
      keyOf={(entry) => entry.id}
      loading={list.loading}
      error={list.error}
      onRetry={list.reload}
      searchPlaceholder="Search member, context or note…"
      server={{
        total: list.data?.total ?? 0,
        query: list.query,
        onQueryChange: list.setQuery,
        narrowed: list.narrowed,
      }}
      empty={{ title: 'No credit activity yet' }}
      toolbar={
        <>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger size="lg" className="w-40" aria-label="Filter by type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All activity</SelectItem>
              {(Object.keys(KIND_LABELS) as CreditEntryKind[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {KIND_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger size="lg" className="w-52" aria-label="Filter by action">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a.action} value={a.action}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      }
    />
  )
}

export function CreditRatesTable({
  rates,
  editable,
  onChanged,
}: {
  rates: CreditRate[] | null
  editable: boolean
  onChanged?: () => void
}) {
  const [editing, setEditing] = useState<CreditRate | null>(null)

  const columns: ColumnDef<CreditRate>[] = [
    {
      key: 'label',
      header: 'Action',
      render: (rate) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{rate.label}</p>
          {rate.description && <p className="text-xs text-muted-foreground">{rate.description}</p>}
        </div>
      ),
    },
    {
      key: 'credits',
      header: 'Credits',
      align: 'right',
      width: 'w-28',
      render: (rate) => <span className="font-medium tabular-nums text-foreground">{formatCredits(rate.credits)}</span>,
    },
    ...(editable
      ? [
          {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right' as const,
            width: 'w-28',
            render: (rate: CreditRate) => (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setEditing(rate)}>
                  <Pencil aria-hidden />
                  Edit
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <DataTable
        data={rates}
        columns={columns}
        keyOf={(rate) => rate.action}
        loading={rates === null}
        empty={{ title: 'No prices set' }}
      />
      {editing && (
        <CreditRateDialog
          rate={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null)
            onChanged?.()
          }}
        />
      )}
    </>
  )
}
