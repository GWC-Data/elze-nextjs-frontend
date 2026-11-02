'use client'

import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Link, useNavigate } from '@/lib/router'
import {
  BookOpen,
  Check,
  Clock,
  Code,
  Copy,
  Download,
  Eye,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
  Wand2,
} from 'lucide-react'
import { usePaths } from '@/hooks/usePaths'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { downloadYaml } from '@/lib/playbookYaml'
import { Page, PageHeader, Section } from '@/components/common/Page'
import { EmptyState } from '@/components/common/States'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePlaybookStore } from '@/components/common/playbooks/PlaybookStore'
import { FilterTabs } from '@/components/common/playbooks/FilterTabs'
import { RunPlaybookDialog } from '@/components/common/playbooks/RunPlaybookDialog'
import {
  DomainBadge,
  HealthRing,
  PlaybookStatusBadge,
  RunStatusBadge,
  WARNING_TEXT,
} from '@/components/common/playbooks/PlaybookBadges'
import type { Playbook, PlaybookStatus } from '@/types/playbooks'

type Filter = 'all' | PlaybookStatus

const stop = (event: MouseEvent) => event.stopPropagation()

export default function PlaybooksPage() {
  const paths = usePaths()
  const navigate = useNavigate()
  const store = usePlaybookStore()
  const { playbooks } = store

  const [filter, setFilter] = useState<Filter>('all')
  const [running, setRunning] = useState<Playbook | null>(null)
  const [deleting, setDeleting] = useState<Playbook | null>(null)

  const shown = playbooks.filter((playbook) => filter === 'all' || playbook.status === filter)
  const count = (status: PlaybookStatus) => playbooks.filter((playbook) => playbook.status === status).length

  const togglePause = (playbook: Playbook) => {
    const pause = playbook.status === 'active'
    store.setPaused(playbook.id, pause)
    notify.success(`${playbook.name} ${pause ? 'paused' : 'resumed'}.`)
  }

  const duplicate = (playbook: Playbook) => {
    const copy = store.duplicate(playbook.id)
    if (copy) notify.success(`Duplicated as “${copy.name}”.`)
  }

  const exportYaml = (playbook: Playbook) => {
    downloadYaml(playbook.name, playbook.yaml)
    notify.success(`${playbook.name} exported as YAML.`)
  }

  const confirmDelete = () => {
    if (!deleting) return
    store.remove(deleting.id)
    notify.success(`${deleting.name} deleted.`)
    setDeleting(null)
  }

  return (
    <Page>
      <PageHeader
        title="Playbooks"
        actions={
          <FilterTabs
            label="Filter playbooks by status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: playbooks.length },
              { value: 'active', label: 'Active', count: count('active') },
              { value: 'paused', label: 'Paused', count: count('paused') },
            ]}
          />
        }
      />

      {shown.length === 0 ? (
        <Section className="mt-0">
          <EmptyState icon={BookOpen} title={playbooks.length === 0 ? 'No playbooks yet' : `No ${filter} playbooks`} />
        </Section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((playbook) => (
            <PlaybookCard
              key={playbook.id}
              playbook={playbook}
              viewPath={paths.playbook(playbook.id)}
              editPath={paths.playbookEditor(playbook.id)}
              onOpen={() => navigate(paths.playbook(playbook.id))}
              onRun={() => setRunning(playbook)}
              onTogglePause={() => togglePause(playbook)}
              onDuplicate={() => duplicate(playbook)}
              onExport={() => exportYaml(playbook)}
              onVersions={() => navigate(`${paths.playbookEditor(playbook.id)}?tab=versions`)}
              onDelete={() => setDeleting(playbook)}
            />
          ))}
        </div>
      )}

      <RunPlaybookDialog playbook={running} onClose={() => setRunning(null)} />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete ${deleting.name}?` : ''}
        body="It stops running and its executions and findings are removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </Page>
  )
}

function PlaybookCard({
  playbook,
  viewPath,
  editPath,
  onOpen,
  onRun,
  onTogglePause,
  onDuplicate,
  onExport,
  onVersions,
  onDelete,
}: {
  playbook: Playbook
  viewPath: string
  editPath: string
  onOpen: () => void
  onRun: () => void
  onTogglePause: () => void
  onDuplicate: () => void
  onExport: () => void
  onVersions: () => void
  onDelete: () => void
}) {
  const paused = playbook.status === 'paused'
  const latest = playbook.history[0]?.status ?? 'healthy'
  const insight = latest !== 'healthy'

  return (
    <article
      onClick={onOpen}
      className="flex cursor-pointer flex-col rounded-xl border bg-card transition-colors hover:border-primary/40"
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DomainBadge domain={playbook.domainLabel} tone={playbook.tone} />
            <Link
              to={viewPath}
              onClick={stop}
              className="mt-1 block truncate text-base font-semibold text-card-foreground hover:text-primary"
            >
              {playbook.name}
            </Link>
          </div>
          <div onClick={stop}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${playbook.name}`}>
                  <MoreHorizontal aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onDuplicate}>
                  <Copy aria-hidden />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExport}>
                  <Download aria-hidden />
                  Export YAML
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onVersions}>
                  <Clock aria-hidden />
                  Version history
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  <Trash2 aria-hidden />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{playbook.purpose}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <PlaybookStatusBadge status={playbook.status} />
          <RunStatusBadge status={latest} />
        </div>

        <dl className="grid grid-cols-3 gap-3 border-y py-3 text-xs">
          <Meta label="Frequency" value={playbook.frequency} />
          <Meta label="Last execution" value={playbook.lastRun} />
          <Meta label="Next run" value={paused ? 'Paused' : playbook.nextRun} />
        </dl>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HealthRing value={playbook.health} />
            Health · {playbook.aiConfidence}% confidence
          </div>
          <span className={cn('inline-flex items-center gap-1 text-xs font-medium', insight ? WARNING_TEXT : 'text-success')}>
            {insight ? <Wand2 className="size-3.5" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
            {insight ? 'New insight surfaced' : 'No anomalies'}
          </span>
        </div>
      </div>

      <footer onClick={stop} className="flex flex-wrap items-center gap-2 border-t px-4 py-2.5">
        <Button asChild size="sm" variant="outline">
          <Link to={viewPath}>
            <Eye aria-hidden />
            View
          </Link>
        </Button>
        <Button size="sm" onClick={onRun}>
          <Play aria-hidden />
          Run now
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to={editPath}>
            <Code aria-hidden />
            Edit playbook
          </Link>
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onTogglePause}>
          {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
          {paused ? 'Resume' : 'Pause'}
        </Button>
      </footer>
    </article>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-foreground">{value}</dd>
    </div>
  )
}
