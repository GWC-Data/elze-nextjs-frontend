import { useMemo, useState } from 'react'
import { Layers, Loader2, PauseCircle } from 'lucide-react'
import { fetchGroupContexts } from '@/api/workspace.api'
import { listConnections } from '@/api/connection.api'
import { shareContextWithGroup, unshareContextWithGroup } from '@/api/contextAccess.api'
import { useAsync } from '@/hooks/useAsync'
import { EmptyState, ErrorState, InlineLoading } from '@/components/common/States'
import { AccessMenu } from '@/components/common/metadata-lakehouse/AccessMenu'
import { ConnectorMark } from '@/components/common/metadata-lakehouse/ConnectorMark'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { notify } from '@/lib/notify'
import { CONTEXT_ACCESS_LABELS } from '@/lib/contextAccess'
import type { Group } from '@/types/admin'
import type { ContextAccessLevel, GroupSharedContext } from '@/types/metadataLakehouse'

const NOW_CAN: Record<ContextAccessLevel, string> = {
  view: 'can now view',
  edit: 'can now edit',
  full: 'now has full access to',
}

function contextTitle(context: Pick<GroupSharedContext, 'name' | 'publishedVersion'>): string {
  return context.publishedVersion ? `${context.name} v${context.publishedVersion}` : context.name
}

export function GroupContexts({ group, onChanged }: { group: Group; onChanged?: () => void }) {
  const shared = useAsync(() => fetchGroupContexts(group.id), [group.id])
  const connections = useAsync(() => listConnections(), [])
  const [connectionId, setConnectionId] = useState('')
  const [level, setLevel] = useState<ContextAccessLevel>('view')
  const [adding, setAdding] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const manageable = useMemo(
    () => new Set((connections.data ?? []).filter((c) => c.access?.canShare).map((c) => c.id)),
    [connections.data]
  )
  const sharedIds = new Set((shared.data ?? []).map((s) => s.connectionId))
  const candidates = (connections.data ?? []).filter(
    (c) =>
      c.access?.canShare &&
      c.published &&
      (c.companyId === group.companyId || c.companyId === null) &&
      !sharedIds.has(c.id)
  )
  const chosen = candidates.find((c) => c.id === connectionId) ?? null

  const refresh = () => {
    shared.reload()
    onChanged?.()
  }

  const add = async () => {
    if (!chosen) return
    setAdding(true)
    try {
      await shareContextWithGroup(chosen.id, group.id, level)
      notify.success(
        `${group.name} ${NOW_CAN[level]} ${chosen.published?.name ?? chosen.name}.`,
        'Every active member of the group has it now.'
      )
      setConnectionId('')
      refresh()
    } catch (err) {
      notify.failure('share that context with the group', err)
    } finally {
      setAdding(false)
    }
  }

  const change = async (context: GroupSharedContext, next: ContextAccessLevel) => {
    if (next === context.level) return
    setPendingId(context.connectionId)
    try {
      await shareContextWithGroup(context.connectionId, group.id, next)
      notify.success(`${group.name} ${NOW_CAN[next]} ${context.name}.`)
      refresh()
    } catch (err) {
      notify.failure('change that access', err)
    } finally {
      setPendingId(null)
    }
  }

  const remove = async (context: GroupSharedContext) => {
    setPendingId(context.connectionId)
    try {
      await unshareContextWithGroup(context.connectionId, group.id)
      notify.success(`${group.name} can no longer open ${context.name}.`)
      refresh()
    } catch (err) {
      notify.failure('remove that access', err)
    } finally {
      setPendingId(null)
    }
  }

  const rows = shared.data ?? []

  return (
    <div className="space-y-4">
      {group.active ? (
        <div className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-2 sm:flex-row sm:items-center">
          <Select value={connectionId} onValueChange={setConnectionId} disabled={adding}>
            <SelectTrigger
              className="h-10 min-w-0 flex-1 border-0 bg-background shadow-none"
              aria-label="Choose a published context"
            >
              <SelectValue
                placeholder={
                  connections.loading
                    ? 'Loading contexts…'
                    : candidates.length
                      ? 'Choose a published context to share…'
                      : 'No other context you can share'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.published ? `${c.published.name} ${c.published.label}` : c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <AccessMenu value={level} onChange={setLevel} disabled={adding} label="Access for the group" />
            <Button onClick={() => void add()} disabled={!chosen || adding} className="min-w-20">
              {adding ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Share
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          <PauseCircle className="size-4 shrink-0" aria-hidden />
          This group is paused. Resume it to share contexts with its members.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        {shared.error ? (
          <ErrorState error={shared.error} title="Unable to load shared contexts" onRetry={shared.reload} compact />
        ) : shared.loading ? (
          <InlineLoading label="Loading shared contexts…" />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No context shared yet"
            body={group.active ? 'Choose a published context above and every member can open it.' : undefined}
            icon={Layers}
            compact
          />
        ) : (
          <ul className="divide-y">
            {rows.map((context) => {
              const pending = pendingId === context.connectionId
              const canManage = manageable.has(context.connectionId)
              return (
                <li key={context.connectionId} className="flex items-center gap-3 px-4 py-3">
                  <ConnectorMark provider={context.provider} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{contextTitle(context)}</span>
                    <span className="block truncate text-xs text-muted-foreground capitalize">
                      {context.publishedVersion ? context.provider : `${context.provider} · not published yet`}
                    </span>
                  </span>
                  {canManage ? (
                    <AccessMenu
                      value={context.level}
                      onChange={(next) => void change(context, next)}
                      onRemove={() => void remove(context)}
                      disabled={pending}
                      busy={pending}
                      label={`Access to ${context.name}`}
                      quiet
                    />
                  ) : (
                    <span className="shrink-0 text-sm text-muted-foreground">{CONTEXT_ACCESS_LABELS[context.level]}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
