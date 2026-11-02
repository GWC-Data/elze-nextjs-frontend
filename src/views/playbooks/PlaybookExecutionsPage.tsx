'use client'

import { useState } from 'react'
import { useNavigate, useSearchParams } from '@/lib/router'
import { ChevronRight, X } from 'lucide-react'
import { usePaths } from '@/hooks/usePaths'
import { cn } from '@/lib/utils'
import { formatKpi, insightProfile } from '@/lib/playbookInsights'
import { Page, PageHeader, Section } from '@/components/common/Page'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePlaybookStore } from '@/components/common/playbooks/PlaybookStore'
import { FilterTabs } from '@/components/common/playbooks/FilterTabs'
import {
  DomainBadge,
  RunStatusBadge,
  WARNING_TEXT,
  healthTone,
} from '@/components/common/playbooks/PlaybookBadges'
import type { Execution, InsightProfile, Playbook, RunStatus } from '@/types/playbooks'

const ALL = 'all'

type StatusFilter = typeof ALL | RunStatus

interface ExecutionRow {
  playbook: Playbook
  execution: Execution
  index: number
  profile: InsightProfile
}

function statusFrom(value: string | null): StatusFilter {
  return value === 'attention' || value === 'healthy' ? value : ALL
}

export default function PlaybookExecutionsPage() {
  const paths = usePaths()
  const navigate = useNavigate()
  const { playbooks, executions } = usePlaybookStore()
  const [params] = useSearchParams()

  const [status, setStatus] = useState<StatusFilter>(() => statusFrom(params.get('status')))
  const [playbookId, setPlaybookId] = useState<string>(() => {
    const requested = params.get('playbook')
    return playbooks.some((playbook) => playbook.id === requested) ? (requested as string) : ALL
  })
  const [domain, setDomain] = useState(ALL)

  const rows: ExecutionRow[] = playbooks
    .flatMap((playbook) =>
      (executions[playbook.id] ?? []).map((execution, index) => ({
        playbook,
        execution,
        index,
        profile: insightProfile(playbook),
      }))
    )
    .sort((a, b) => a.index - b.index)
  const domains = [...new Set(playbooks.map((playbook) => playbook.domainLabel))]
  const narrowed = playbookId !== ALL || domain !== ALL
  const shown = rows.filter(
    (row) =>
      (status === ALL || row.execution.status === status) &&
      (playbookId === ALL || row.playbook.id === playbookId) &&
      (domain === ALL || row.playbook.domainLabel === domain)
  )
  const countOf = (value: RunStatus) => rows.filter((row) => row.execution.status === value).length

  const columns: ColumnDef<ExecutionRow>[] = [
    {
      key: 'playbook',
      header: 'Playbook',
      sortValue: (row) => row.playbook.name,
      render: (row) => <span className="font-medium text-foreground">{row.playbook.name}</span>,
    },
    {
      key: 'domain',
      header: 'Domain',
      secondary: true,
      sortValue: (row) => row.playbook.domainLabel,
      render: (row) => <DomainBadge domain={row.playbook.domainLabel} tone={row.playbook.tone} />,
    },
    {
      key: 'when',
      header: 'When',
      sortValue: (row) => row.index,
      render: (row) => <span className="text-muted-foreground">{row.execution.when}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => row.execution.status,
      render: (row) => <RunStatusBadge status={row.execution.status} />,
    },
    {
      key: 'kpi',
      header: 'KPI',
      secondary: true,
      render: (row) => (
        <span className="text-muted-foreground">
          {row.profile.kpiLabel}:{' '}
          <strong className="font-semibold text-foreground tabular-nums">{formatKpi(row.profile, row.execution.kpiValue)}</strong>
        </span>
      ),
    },
    {
      key: 'health',
      header: 'Health',
      align: 'right',
      sortValue: (row) => row.execution.healthScore,
      render: (row) => (
        <span className={cn('font-medium tabular-nums', healthTone(row.execution.healthScore))}>
          {row.execution.healthScore}
        </span>
      ),
    },
    {
      key: 'findings',
      header: 'Findings',
      align: 'right',
      sortValue: (row) => (row.execution.status === 'attention' ? row.profile.findings.length : 0),
      render: (row) => {
        const count = row.execution.status === 'attention' ? row.profile.findings.length : 0
        return count > 0 ? (
          <span className={cn('font-medium', WARNING_TEXT)}>
            {count} finding{count === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="text-muted-foreground">None</span>
        )
      },
    },
    {
      key: 'open',
      header: <span className="sr-only">Open</span>,
      width: 'w-10',
      render: () => <ChevronRight className="size-4 text-muted-foreground" aria-hidden />,
    },
  ]

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: 'Playbooks', to: paths.playbooks }, { label: 'Executions' }]}
        title="Executions"
        actions={
          <FilterTabs
            label="Filter executions by status"
            value={status}
            onChange={setStatus}
            options={[
              { value: ALL, label: 'All', count: rows.length },
              { value: 'attention', label: 'Needs attention', count: countOf('attention') },
              { value: 'healthy', label: 'Healthy', count: countOf('healthy') },
            ]}
          />
        }
      />

      <Section className="mt-0" flush>
        <DataTable
          data={shown}
          columns={columns}
          keyOf={(row) => row.execution.id}
          searchFilter={(row, query) => row.playbook.name.toLowerCase().includes(query)}
          searchPlaceholder="Search playbooks…"
          searchClassName="sm:w-72"
          pageSize={20}
          onRowClick={(row) => navigate(`${paths.playbook(row.playbook.id)}?run=${row.index}&from=executions`)}
          toolbar={
            <>
              <Select value={playbookId} onValueChange={setPlaybookId}>
                <SelectTrigger size="lg" className="min-w-48" aria-label="Filter by playbook">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All playbooks</SelectItem>
                  {playbooks.map((playbook) => (
                    <SelectItem key={playbook.id} value={playbook.id}>
                      {playbook.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger size="lg" className="min-w-44" aria-label="Filter by domain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All domains</SelectItem>
                  {domains.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {narrowed ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPlaybookId(ALL)
                    setDomain(ALL)
                  }}
                >
                  <X aria-hidden />
                  Clear
                </Button>
              ) : null}
            </>
          }
          empty={{ title: narrowed || status !== ALL ? 'No executions match these filters' : 'No executions yet' }}
        />
      </Section>
    </Page>
  )
}
