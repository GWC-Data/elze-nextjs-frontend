'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams, useSearchParams } from '@/lib/router'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Code,
  GitBranch,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Target,
  Terminal,
  Wand2,
} from 'lucide-react'
import { usePaths } from '@/hooks/usePaths'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import {
  agentTrace,
  confidenceWord,
  executiveSummary,
  findingEvidence,
  formatKpi,
  insightProfile,
  kpiChange,
  runFindings,
  runRecommendations,
  technicalDetails,
} from '@/lib/playbookInsights'
import { Page, PageHeader, Section } from '@/components/common/Page'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePlaybookStore } from '@/components/common/playbooks/PlaybookStore'
import { PlaybookNotFound } from '@/components/common/playbooks/PlaybookNotFound'
import { RunPlaybookDialog } from '@/components/common/playbooks/RunPlaybookDialog'
import { KpiTrendChart } from '@/components/common/playbooks/KpiTrendChart'
import { InvestigationPanel } from '@/components/common/playbooks/InvestigationPanel'
import { AgentThread } from '@/components/common/playbooks/AgentThread'
import { ActivityFeed } from '@/components/common/playbooks/ActivityFeed'
import { RichText } from '@/components/common/playbooks/RichText'
import { ActionComposerDialog, type ActionTarget } from '@/components/common/playbooks/ActionComposerDialog'
import {
  AiBadge,
  DomainBadge,
  HealthRing,
  ImpactBadge,
  PlaybookStatusBadge,
  PriorityBadge,
  RunStatusBadge,
} from '@/components/common/playbooks/PlaybookBadges'
import type { ActionRequest, Execution, Finding, InsightProfile, Playbook } from '@/types/playbooks'

type DetailTab = 'overview' | 'findings' | 'recommendations' | 'details'

export default function PlaybookDetailPage() {
  const { playbookId } = useParams<{ playbookId: string }>()
  const { playbooks } = usePlaybookStore()
  const playbook = playbooks.find((item) => item.id === playbookId)
  if (!playbook) return <PlaybookNotFound />
  return <PlaybookDetail key={playbook.id} playbook={playbook} />
}

function PlaybookDetail({ playbook }: { playbook: Playbook }) {
  const paths = usePaths()
  const store = usePlaybookStore()
  const [params] = useSearchParams()
  const executions = store.executions[playbook.id] ?? []
  const fromExecutions = params.get('from') === 'executions'

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const requested = Number(params.get('run'))
    return Number.isInteger(requested) && requested >= 0 && requested < executions.length ? requested : 0
  })
  const [tab, setTab] = useState<DetailTab>('overview')
  const [running, setRunning] = useState(false)
  const [target, setTarget] = useState<ActionTarget | null>(null)

  const execution = executions[Math.min(selectedIndex, executions.length - 1)]
  if (!execution) return <PlaybookNotFound />

  const profile = insightProfile(playbook)
  const anomaly = execution.status === 'attention'
  const latest = executions[0]
  const paused = playbook.status === 'paused'
  const findings = runFindings(profile, execution)
  const recommendations = runRecommendations(profile, execution)
  const change = kpiChange(profile, execution.kpiValue)

  const crumbs = fromExecutions
    ? [
        { label: 'Playbooks', to: paths.playbooks },
        { label: 'Executions', to: paths.playbookExecutions },
        { label: playbook.name },
      ]
    : [{ label: 'Playbooks', to: paths.playbooks }, { label: playbook.name }]

  const togglePause = () => {
    store.setPaused(playbook.id, !paused)
    notify.success(`${playbook.name} ${paused ? 'resumed' : 'paused'}.`)
  }

  const sendAction = (action: ActionTarget, request: ActionRequest) => {
    store.sendAction({
      playbookId: action.playbook.id,
      executionId: action.execution.id,
      findingIndex: action.findingIndex,
      request,
    })
    notify.success(`Notification sent to ${request.recipients.join(', ')}.`)
    setTarget(null)
  }

  return (
    <Page>
      <PageHeader
        crumbs={crumbs}
        title={playbook.name}
        actions={
          <>
            <Button onClick={() => setRunning(true)}>
              <Play aria-hidden />
              Run now
            </Button>
            <Button variant="outline" onClick={togglePause}>
              {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
            <Button asChild variant="outline">
              <Link to={paths.playbookEditor(playbook.id)}>
                <Code aria-hidden />
                Edit playbook
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border bg-card px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <DomainBadge domain={playbook.domainLabel} tone={playbook.tone} />
          {paused ? <PlaybookStatusBadge status="paused" /> : <RunStatusBadge status={latest.status} />}
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Fact label="Last execution" value={playbook.lastRun} />
          <Fact label="Next scheduled run" value={paused ? 'Paused' : playbook.nextRun} />
          <Fact label="Frequency" value={playbook.frequency} />
        </dl>
      </div>

      <Section title="Last 5 executions" bodyClassName="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {executions.map((run, index) => (
            <RunCard key={run.id} run={run} selected={index === selectedIndex} onSelect={() => setSelectedIndex(index)} />
          ))}
        </div>
      </Section>

      <Tabs value={tab} onValueChange={(value) => setTab(value as DetailTab)} className="mt-5 gap-4">
        <TabsList variant="line">
          <TabsTrigger value="overview">
            <Wand2 aria-hidden />
            Overview
          </TabsTrigger>
          <TabsTrigger value="findings">
            <Search aria-hidden />
            Findings
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Target aria-hidden />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="details">
            <Terminal aria-hidden />
            Execution details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" forceMount className="space-y-4 data-[state=inactive]:hidden">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Section className="mt-0" title="Executive summary" actions={<AiBadge />}>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <RichText text={executiveSummary(profile, execution)} />
              </p>
            </Section>
            <Section className="mt-0" title={profile.kpiLabel}>
              <dl className="grid grid-cols-3 gap-3">
                <Figure label="Current period" value={formatKpi(profile, execution.kpiValue)} />
                <Figure label="Previous period" value={formatKpi(profile, profile.baseline)} />
                <Figure
                  label="Change"
                  value={
                    <span className={cn('inline-flex items-center gap-0.5', change.good ? 'text-success' : 'text-destructive')}>
                      {change.pct >= 0 ? <ArrowUp className="size-4" aria-hidden /> : <ArrowDown className="size-4" aria-hidden />}
                      {Math.abs(change.pct).toFixed(1)}%
                    </span>
                  }
                />
              </dl>
            </Section>
          </div>

          <Section className="mt-0" title="KPI trend" description={`${profile.kpiLabel} · last ${executions.length} executions`}>
            <KpiTrendChart
              executions={executions}
              profile={profile}
              selectedId={execution.id}
              onSelect={(id) => setSelectedIndex(Math.max(0, executions.findIndex((run) => run.id === id)))}
            />
          </Section>

          <InvestigationPanel key={execution.id} profile={profile} anomaly={anomaly} onJump={setTab} />
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <ol className="space-y-3">
            {findings.map((finding, index) => (
              <FindingCard
                key={finding.title}
                index={index}
                finding={finding}
                profile={profile}
                playbook={playbook}
                actionable={anomaly}
                actioned={execution.actioned.includes(index)}
                onTakeAction={() => setTarget({ playbook, execution, profile, finding, findingIndex: index })}
              />
            ))}
          </ol>
          <Section
            className="mt-0"
            title="Action activity"
            actions={
              <Button asChild size="sm" variant="ghost">
                <Link to={paths.playbookActions}>Open actions</Link>
              </Button>
            }
          >
            <ActivityFeed items={execution.activity} empty="No activity for this execution." />
          </Section>
        </TabsContent>

        <TabsContent value="recommendations">
          <ol className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <li key={recommendation.text} className="flex flex-wrap items-start gap-3 rounded-xl border bg-card p-4">
                <Rank value={index + 1} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold text-card-foreground">{recommendation.text}</p>
                  {recommendation.reason ? <p className="text-sm text-muted-foreground">{recommendation.reason}</p> : null}
                  {recommendation.impactNote ? (
                    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      <Target className="size-3.5" aria-hidden />
                      {recommendation.impactNote}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <ImpactBadge impact={recommendation.impact} />
                  <PriorityBadge priority={recommendation.priority} />
                </div>
              </li>
            ))}
          </ol>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Section className="mt-0" title="Execution details">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              {technicalDetails(playbook, execution).map(([label, value]) => (
                <Fact key={label} label={label} value={value} />
              ))}
            </dl>
          </Section>
          <Section
            className="mt-0"
            title={
              <span className="inline-flex items-center gap-1.5">
                <GitBranch className="size-4" aria-hidden />
                Agent trace
              </span>
            }
          >
            <AgentThread steps={agentTrace(playbook, execution, profile)} />
          </Section>
        </TabsContent>
      </Tabs>

      <RunPlaybookDialog
        playbook={running ? playbook : null}
        onClose={() => setRunning(false)}
        onCompleted={() => setSelectedIndex(0)}
      />
      <ActionComposerDialog target={target} onClose={() => setTarget(null)} onSend={sendAction} />
    </Page>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-foreground">{value}</dd>
    </div>
  )
}

function Figure({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/30 px-3 py-2.5">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-foreground tabular-nums">{value}</dd>
    </div>
  )
}

function Rank({ value }: { value: number }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground tabular-nums">
      {value}
    </span>
  )
}

function RunCard({ run, selected, onSelect }: { run: Execution; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-3 text-left transition-colors',
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'bg-background hover:border-primary/40'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{run.when}</span>
        <RunStatusBadge status={run.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <RunMeta label="Duration" value={run.duration} />
        <RunMeta label="Records" value={run.recordsProcessed.toLocaleString('en-US')} />
        <RunMeta label="KPIs evaluated" value={String(run.kpisEvaluated)} />
        <RunMeta label="Alerts" value={String(run.alertsGenerated)} />
      </dl>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <HealthRing value={run.healthScore} size="sm" />
        Health score
      </div>
    </button>
  )
}

function RunMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground tabular-nums">{value}</dd>
    </div>
  )
}

function FindingCard({
  index,
  finding,
  profile,
  playbook,
  actionable,
  actioned,
  onTakeAction,
}: {
  index: number
  finding: Finding
  profile: InsightProfile
  playbook: Playbook
  actionable: boolean
  actioned: boolean
  onTakeAction: () => void
}) {
  const [open, setOpen] = useState(false)
  const sources = [...new Set([...playbook.dataSources.slice(0, 2), ...playbook.tables.slice(0, 2)])]

  return (
    <li className="flex gap-3 rounded-xl border bg-card p-4">
      <Rank value={index + 1} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-card-foreground">{finding.title}</h3>
          <ImpactBadge impact={finding.impact} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{finding.description}</p>
        {finding.impactNote ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
            <Target className="size-3.5" aria-hidden />
            {finding.impactNote}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden />
            {confidenceWord(finding.confidence)} confidence —
            <strong className="font-semibold text-foreground">{finding.confidence}%</strong>
          </span>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            View evidence
            <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
        </div>

        {open ? (
          <div className="mt-2 space-y-2 rounded-lg bg-muted/40 p-3">
            <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
              {findingEvidence(profile, finding).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((source) => (
                <span key={source} className="rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {source}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {actionable ? (
          <div className="mt-3 flex justify-end">
            {actioned ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <Check className="size-3.5" aria-hidden />
                Action sent
              </span>
            ) : (
              <Button size="sm" variant="outline" onClick={onTakeAction}>
                Take action
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </li>
  )
}
