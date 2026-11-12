import { useDeferredValue, useState } from 'react'
import type React from 'react'
import { Link, useNavigate } from '@/lib/router'
import {
  Building2,
  Clock,
  GitBranchPlus,
  History,
  Layers,
  MoreHorizontal,
  Plug,
  Share2,
  Sparkles,
  Table2,
  Trash2,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ErrorState } from '@/components/common/States'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import {
  useCompanyPublished,
  useCreateVersion,
  useDeleteConnection,
  useDeleteVersion,
} from '@/hooks/useMetadataLakehouse'
import { ConnectorMark } from '@/components/common/metadata-lakehouse/ConnectorMark'
import { Pagination } from '@/components/common/Pagination'
import { serverPage } from '@/hooks/usePagination'
import { formatDateTime, formatExact, formatRelativeTime } from '@/lib/format'
import type { McpTarget, PublishedContextGroup, PublishedVersionEntry } from '@/types/metadataLakehouse'
import { useAuth } from '@/context/authContext'
import {
  LevelChip,
  LivePill,
  OwnerChip,
  SharingChip,
  StatTile,
} from '@/components/common/metadata-lakehouse/ContextCardParts'

export interface ShareTarget {
  id: string
  name: string
}
import { Hint } from '@/components/common/Hint'
import { accessAtLeast } from '@/lib/contextAccess'

const PAGE_SIZE = 10

export function PublishedContextsSection({
  builderPath,
  datasetsPath,
  publishedPath,
  onMcp,
  onShare,
  search,
}: {
  builderPath: (connectionId: string) => string
  datasetsPath: (connectionId: string) => string
  publishedPath: (connectionId: string, versionId: string) => string
  onMcp: (target: McpTarget) => void
  onShare: (target: ShareTarget) => void
  search: string
}) {
  const [page, setPage] = useState(1)
  const [pageFor, setPageFor] = useState(search)
  if (search !== pageFor) {
    setPageFor(search)
    setPage(1)
  }
  const query = useDeferredValue(search).trim()
  const published = useCompanyPublished({ page, pageSize: PAGE_SIZE, ...(query ? { search: query } : {}) })
  const data = published.data

  if (published.isError) {
    return (
      <ErrorState
        error={published.error}
        title="Unable to load the published contexts"
        onRetry={() => published.refetch()}
      />
    )
  }
  if (!data) {
    return <div className="h-24 animate-pulse rounded-xl border bg-muted/30" aria-busy="true" />
  }
  if (data.total === 0 && !query) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing published yet. Finish a draft’s Publish step and it appears here.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {data.items.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
          No published context matches “{search}”.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.items.map((group) => (
            <PublishedContextCard
              key={`${group.connectionId}:${group.name}`}
              group={group}
              builderPath={builderPath(group.connectionId)}
              datasetsPath={datasetsPath(group.connectionId)}
              versionPath={(versionId) => publishedPath(group.connectionId, versionId)}
              onMcp={onMcp}
              onShare={onShare}
            />
          ))}
        </div>
      )}

      <Pagination {...serverPage(page, PAGE_SIZE, data.total)} setPage={setPage} noun="contexts" />
    </div>
  )
}

function PublishedContextCard({
  group,
  builderPath,
  datasetsPath,
  versionPath,
  onMcp,
  onShare,
}: {
  group: PublishedContextGroup
  builderPath: string
  datasetsPath: string
  versionPath: (versionId: string) => string
  onMcp: (target: McpTarget) => void
  onShare: (target: ShareTarget) => void
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const { user } = useAuth()
  const platformConsole = user?.companyId === null
  const [deleting, setDeleting] = useState<PublishedVersionEntry | null>(null)
  const access = group.access ?? null
  const canEdit = accessAtLeast(access, 'edit')
  const canDelete = accessAtLeast(access, 'full')
  const remove = useDeleteVersion()
  const removeConnection = useDeleteConnection()
  const [removingContext, setRemovingContext] = useState(false)
  const create = useCreateVersion(group.connectionId)
  const navigate = useNavigate()

  const confirmRemoveContext = async (permanent: boolean) => {
    try {
      await removeConnection.mutateAsync({ id: group.connectionId, permanent })
      notify.success(
        `${group.name} was ${permanent ? 'permanently removed' : 'removed'}.`,
        permanent ? 'Its stored credential was erased.' : undefined
      )
      setRemovingContext(false)
    } catch (err) {
      notify.failure(`remove ${group.name}`, err)
    }
  }

  const startNewVersion = async () => {
    try {
      const state = await create.mutateAsync()
      notify.success(
        `${state.draft?.label ?? 'A new version'} of ${group.name} is open as a draft.`,
        'The published versions are unchanged.'
      )
      navigate(builderPath)
    } catch (err) {
      notify.failure(`create a new version of ${group.name}`, err)
    }
  }
  const live = group.versions[0]

  const confirmDelete = async (permanent: boolean) => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ connectionId: group.connectionId, versionId: deleting.id, permanent })
      notify.success(
        `${group.name} ${deleting.label} was ${permanent ? 'permanently deleted' : 'deleted'}.`,
        'Every other version is unchanged.'
      )
      setDeleting(null)
    } catch (err) {
      notify.failure(`delete ${group.name} ${deleting.label}`, err)
    }
  }

  const openLive = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (!event.currentTarget.contains(target)) return
    const control = target.closest('a, button, input, [role="menuitem"], [role="dialog"]')
    if (control && control !== event.currentTarget) return
    navigate(versionPath(live.id))
  }

  const openLabel = `Open ${group.name} ${live.label}`

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={openLabel}
      onClick={openLive}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          navigate(versionPath(live.id))
        }
      }}
      className="group flex cursor-pointer flex-col rounded-2xl border bg-card shadow-xs transition-all hover:-translate-y-px hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <header className="flex items-start gap-3 p-5 pb-4">
        <ConnectorMark provider={group.provider} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 truncate text-base font-semibold tracking-tight">{group.name}</span>
            <LivePill label={live.label} />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {group.connectionName !== group.name ? `${group.connectionName} · ` : ''}
            {group.host}
          </p>
        </div>

        {access ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="-mt-0.5 -mr-1.5" aria-label={`Options for ${group.name}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onSelect={() =>
                  onMcp({
                    id: group.connectionId,
                    name: group.connectionName,
                    published: { name: group.name, label: live.label, publishedAt: live.publishedAt },
                  })
                }
              >
                <Plug aria-hidden />
                MCP connection details
              </DropdownMenuItem>
              {access?.canShare ? (
                <DropdownMenuItem onSelect={() => onShare({ id: group.connectionId, name: group.connectionName })}>
                  <Share2 aria-hidden />
                  Share…
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => setHistoryOpen(true)}>
                <History aria-hidden />
                Version history…
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={datasetsPath}>
                  <Table2 aria-hidden />
                  Datasets
                </Link>
              </DropdownMenuItem>
              {canDelete ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setRemovingContext(true)}>
                    <Trash2 aria-hidden />
                    Remove context
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      <div className="grid grid-cols-3 gap-2 px-5">
        <StatTile icon={Sparkles} label="Facts" value={formatExact(live.objectCount)} />
        <StatTile icon={Layers} label="Versions" value={formatExact(group.versions.length)} />
        <StatTile
          icon={Clock}
          label="Published"
          value={formatRelativeTime(live.publishedAt)}
          hint={`${formatDateTime(live.publishedAt)}${live.publishedBy ? ` by ${live.publishedBy}` : ''}`}
        />
      </div>

      <footer className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-5 py-3">
        <OwnerChip access={access} />
        <SharingChip access={access} platform={group.companyId === null} />
        <LevelChip access={access} />
        {platformConsole ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Building2 className="size-3" aria-hidden />
            {group.companyName ?? 'Platform'}
          </span>
        ) : null}
        {canEdit ? (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            disabled={create.isPending}
            onClick={() => void startNewVersion()}
          >
            <GitBranchPlus className="size-4" aria-hidden />
            {create.isPending ? 'Creating…' : 'New version'}
          </Button>
        ) : null}
      </footer>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-4" aria-hidden />
              Version history
            </DialogTitle>
            <DialogDescription>
              {group.name} · {group.versions.length} version{group.versions.length === 1 ? '' : 's'}
            </DialogDescription>
          </DialogHeader>
          <ol className="relative max-h-[60vh] space-y-0.5 overflow-y-auto pr-1">
            {group.versions.map((v, i) => (
              <li key={v.id} className="relative flex gap-3 pb-2 last:pb-0">
                <span className="relative flex w-3 shrink-0 justify-center">
                  <span
                    className={cn(
                      'mt-1.5 size-2.5 rounded-full ring-2 ring-card',
                      v.live ? 'bg-success' : 'bg-muted-foreground/40'
                    )}
                    aria-hidden
                  />
                  {i < group.versions.length - 1 ? (
                    <span className="absolute top-4 bottom-0 w-px bg-border" aria-hidden />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      to={versionPath(v.id)}
                      className="font-mono text-xs font-semibold hover:text-primary hover:underline"
                      aria-label={`Open ${group.name} ${v.label}`}
                    >
                      {v.label}
                    </Link>
                    {v.live ? (
                      <Badge className="h-4 bg-success px-1.5 text-[10px] text-white hover:bg-success">Live</Badge>
                    ) : (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-muted-foreground">
                        Superseded
                      </Badge>
                    )}
                    <Hint label={formatDateTime(v.publishedAt)}>
                      <span className="text-xs text-muted-foreground">published {formatRelativeTime(v.publishedAt)}</span>
                    </Hint>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3" aria-hidden />
                      {v.publishedBy ?? 'unknown'}
                    </span>
                    <span>
                      {formatExact(v.objectCount)} fact{v.objectCount === 1 ? '' : 's'}
                    </span>
                  </p>
                </div>
                {canDelete ? (
                  <Hint label={`Delete ${v.label} only`}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${group.name} ${v.label}`}
                      onClick={() => setDeleting(v)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </Hint>
                ) : null}
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={removingContext}
        onOpenChange={(open) => !open && setRemovingContext(false)}
        title={`Remove ${group.name}?`}
        body="The context, its draft and every published version disappear from every list and can no longer be opened."
        confirmLabel="Remove context"
        pending={removeConnection.isPending}
        onConfirm={(permanent) => void confirmRemoveContext(permanent)}
      />

      <DeleteConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete ${group.name} ${deleting.label}?` : ''}
        body={
          deleting
            ? `Only ${deleting.label} is deleted, along with its stored snapshot of ${formatExact(deleting.objectCount)} fact${
                deleting.objectCount === 1 ? '' : 's'
              }. Every other version of “${group.name}” and any open draft stay exactly as they are.`
            : ''
        }
        confirmLabel={deleting ? `Delete ${deleting.label}` : 'Delete'}
        pending={remove.isPending}
        onConfirm={(permanent) => void confirmDelete(permanent)}
      />
    </article>
  )
}
