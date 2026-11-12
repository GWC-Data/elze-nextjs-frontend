'use client'

import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from '@/lib/router'
import {
  ArrowRight,
  Clock,
  Database,
  GitBranch,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Share2,
  Table2,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { usePaths } from '@/hooks/usePaths'
import { Page, PageHeader, Section } from '@/components/common/Page'
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog'
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/common/States'
import { Pagination } from '@/components/common/Pagination'
import { SearchBox, SearchToolbar } from '@/components/common/SearchBox'
import { serverPage } from '@/hooks/usePagination'
import { notify } from '@/lib/notify'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ContextQueryProvider } from '@/context/QueryProvider'
import { useDeleteConnection, useDraftConnections, useVerifyConnection } from '@/hooks/useMetadataLakehouse'
import {
  LevelChip,
  OwnerChip,
  SharingChip,
  StatTile,
  StatusPill,
  StepProgress,
} from '@/components/common/metadata-lakehouse/ContextCardParts'
import { McpDetailsDialog } from '@/components/common/metadata-lakehouse/McpDetailsDialog'
import { ContextShareDialog } from '@/components/common/metadata-lakehouse/ContextShareDialog'
import { accessAtLeast } from '@/lib/contextAccess'
import {
  PublishedContextsSection,
  type ShareTarget,
} from '@/components/common/metadata-lakehouse/PublishedContextsSection'
import { ConnectorMark } from '@/components/common/metadata-lakehouse/ConnectorMark'
import { formatDateTime, formatExact, formatRelativeTime, maskSecretHint } from '@/lib/format'
import type { DraftConnection, McpTarget } from '@/types/metadataLakehouse'

type LakehouseView = 'drafts' | 'published'

const DRAFTS_PAGE_SIZE = 10

export default function MetadataLakehousePage({ view = 'drafts' }: { view?: LakehouseView }) {
  return (
    <ContextQueryProvider>
      {view === 'drafts' ? <DraftsView /> : <PublishedView />}
    </ContextQueryProvider>
  )
}

function ShareDialogFor({ target, onClose }: { target: ShareTarget | null; onClose: () => void }) {
  return (
    <ContextShareDialog
      connectionId={target?.id ?? null}
      name={target?.name ?? ''}
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
    />
  )
}

function DraftsView() {
  const { can } = useAuth()
  const paths = usePaths()
  const navigate = useNavigate()
  const canCreate = can('context.create')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageFor, setPageFor] = useState(search)
  if (search !== pageFor) {
    setPageFor(search)
    setPage(1)
  }
  const query = useDeferredValue(search).trim()
  const drafts = useDraftConnections({ page, pageSize: DRAFTS_PAGE_SIZE, ...(query ? { search: query } : {}) })
  const verify = useVerifyConnection()
  const remove = useDeleteConnection()

  const [deleting, setDeleting] = useState<DraftConnection | null>(null)
  const [shareFor, setShareFor] = useState<ShareTarget | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const runVerify = async (connection: DraftConnection) => {
    setBusyId(connection.id)
    try {
      await verify.mutateAsync(connection.id)
      notify.success(`${connection.name} is still connected.`)
    } catch (err) {
      notify.failure(`verify ${connection.name}`, err)
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async (permanent: boolean) => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ id: deleting.id, permanent })
      notify.success(
        `${deleting.name} was ${permanent ? 'permanently removed' : 'removed'}.`,
        permanent ? 'Its stored credential was erased.' : undefined
      )
      setDeleting(null)
    } catch (err) {
      notify.failure('remove that connection', err)
    }
  }

  const newConnection = (
    <Button onClick={() => navigate(paths.metadataLakehouseConnectors)} disabled={!canCreate}>
      <Plus className="size-4" aria-hidden />
      New connection
    </Button>
  )

  const data = drafts.data
  const items = data?.items ?? []

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: 'Metadata Lakehouse' }, { label: 'Drafts' }]}
        title="Drafts"
        description="Contexts being built from your data sources. Nothing here is served until it is published."
        actions={canCreate ? newConnection : undefined}
      />

      <SearchToolbar
        className="mt-5"
        search={
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search drafts…"
            label="Search drafts by connection or context name"
          />
        }
      />

      {drafts.isError ? (
        <Section>
          <ErrorState error={drafts.error} title="Unable to load your drafts" onRetry={() => drafts.refetch()} />
        </Section>
      ) : !data ? (
        <CardGridSkeleton count={3} />
      ) : data.total === 0 && !query ? (
        <Section>
          <EmptyState
            title="No drafts in progress"
            body={
              canCreate
                ? 'Start a new connection to build a context, or open a context in Published and choose Create new version.'
                : 'Nothing is being built right now. Your role can see contexts but not create them.'
            }
            icon={Database}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {canCreate ? newConnection : null}
                <Button asChild variant="outline">
                  <Link to={paths.metadataLakehousePublished}>Open Published</Link>
                </Button>
              </div>
            }
          />
        </Section>
      ) : (
        <Section>
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
              No draft matches “{search}”.
            </p>
          ) : (
            <div className="space-y-3">
              <div className={cn('grid gap-3 lg:grid-cols-2', drafts.isFetching && 'opacity-70')}>
                {items.map((connection) => (
                  <ConnectionCard
                    key={connection.id}
                    connection={connection}
                    busy={busyId === connection.id}
                    builderPath={paths.metadataLakehouseBuilder(connection.id)}
                    datasetsPath={paths.metadataLakehouseConnection(connection.id)}
                    onVerify={() => void runVerify(connection)}
                    onDelete={() => setDeleting(connection)}
                    onShare={() => setShareFor({ id: connection.id, name: connection.name })}
                  />
                ))}
              </div>
              <Pagination {...serverPage(page, DRAFTS_PAGE_SIZE, data.total)} setPage={setPage} noun="drafts" />
            </div>
          )}
        </Section>
      )}

      <ShareDialogFor target={shareFor} onClose={() => setShareFor(null)} />

      <DeleteConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Remove ${deleting.name}?` : ''}
        body="The connection, its dataset selection and its published versions disappear from every list and can no longer be opened."
        confirmLabel="Remove connection"
        pending={remove.isPending}
        onConfirm={(permanent) => void confirmDelete(permanent)}
      />
    </Page>
  )
}

function PublishedView() {
  const paths = usePaths()
  const [search, setSearch] = useState('')
  const [mcpFor, setMcpFor] = useState<McpTarget | null>(null)
  const [shareFor, setShareFor] = useState<ShareTarget | null>(null)

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: 'Metadata Lakehouse' }, { label: 'Published' }]}
        title="Published"
        description="Every published context you can open, with its full version history. Nothing here changes until a new version is published."
      />

      <SearchToolbar
        className="mt-5"
        search={
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search published contexts…"
            label="Search published contexts by name or connection"
          />
        }
      />

      <Section>
        <PublishedContextsSection
          builderPath={(id) => paths.metadataLakehouseBuilder(id)}
          datasetsPath={(id) => paths.metadataLakehouseConnection(id)}
          publishedPath={(id, versionId) => paths.metadataLakehouseBuilder(id, versionId)}
          onMcp={setMcpFor}
          onShare={setShareFor}
          search={search}
        />
      </Section>

      <McpDetailsDialog connection={mcpFor} onOpenChange={(open) => !open && setMcpFor(null)} />
      <ShareDialogFor target={shareFor} onClose={() => setShareFor(null)} />
    </Page>
  )
}

function ConnectionCard({
  connection,
  busy,
  builderPath,
  datasetsPath,
  onVerify,
  onDelete,
  onShare,
}: {
  connection: DraftConnection
  busy: boolean
  builderPath: string
  datasetsPath: string
  onVerify: () => void
  onDelete: () => void
  onShare: () => void
}) {
  const access = connection.access
  const canManage = accessAtLeast(access, 'edit')
  const canDelete = accessAtLeast(access, 'full')
  const connected = connection.status === 'connected'
  const datasetCount = connection.selectedDatasetCount ?? 0
  const draft = connection.draft
  const title = draft?.name || connection.name
  const subtitle = [
    draft && draft.name !== connection.name ? connection.name : null,
    connection.host,
    maskSecretHint(connection.secretHint),
  ]
    .filter(Boolean)
    .join(' · ')
  const editedAt = draft?.updatedAt ?? null

  return (
    <article className="group flex flex-col rounded-2xl border bg-card shadow-xs transition-all hover:-translate-y-px hover:border-primary/30 hover:shadow-md">
      <header className="flex items-start gap-3 p-5 pb-4">
        <ConnectorMark provider={connection.provider} />
        <div className="min-w-0 flex-1">
          <Link
            to={canManage ? builderPath : datasetsPath}
            className="block truncate text-base font-semibold tracking-tight hover:text-primary"
          >
            {title}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <StatusPill connected={connected} busy={busy} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="-mt-0.5 -mr-1.5" aria-label={`Options for ${title}`}>
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link to={datasetsPath}>
                <Table2 aria-hidden />
                Datasets
              </Link>
            </DropdownMenuItem>
            {canManage ? (
              <DropdownMenuItem disabled={busy} onSelect={onVerify}>
                <RefreshCw aria-hidden />
                {busy ? 'Checking…' : 'Verify connection'}
              </DropdownMenuItem>
            ) : null}
            {access?.canShare ? (
              <DropdownMenuItem onSelect={onShare}>
                <Share2 aria-hidden />
                Share…
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  <Trash2 aria-hidden />
                  Remove connection
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="px-5">
        {draft ? (
          <StepProgress step={draft.step} />
        ) : (
          <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
            No draft yet. Choose datasets to start building a context.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 px-5 pt-4">
        <StatTile icon={Table2} label="Datasets" value={formatExact(datasetCount)} />
        <StatTile icon={GitBranch} label="Version" value={draft ? `Draft ${draft.label}` : '—'} />
        <StatTile
          icon={Clock}
          label={editedAt ? 'Last edited' : 'Verified'}
          value={formatRelativeTime(editedAt ?? connection.lastVerifiedAt)}
          hint={formatDateTime(editedAt ?? connection.lastVerifiedAt)}
        />
      </div>

      {!connected && connection.lastError ? (
        <p className="mx-5 mt-3 rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {connection.lastError}
        </p>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-5 py-3">
        <OwnerChip access={access} />
        <SharingChip access={access} platform={connection.companyId === null} />
        <LevelChip access={access} />
        <div className="ml-auto">
          {canManage ? (
            <Button asChild size="sm">
              <Link to={builderPath}>
                {datasetCount > 0 ? 'Continue building' : 'Build context'}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link to={datasetsPath}>View datasets</Link>
            </Button>
          )}
        </div>
      </footer>
    </article>
  )
}
