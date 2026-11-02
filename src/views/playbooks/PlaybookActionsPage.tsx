'use client'

import { useState } from 'react'
import { Link } from '@/lib/router'
import { Check, CheckCheck, Send } from 'lucide-react'
import { usePaths } from '@/hooks/usePaths'
import { notify } from '@/lib/notify'
import { insightProfile, suggestedAction } from '@/lib/playbookInsights'
import { Page, PageHeader, Section } from '@/components/common/Page'
import { EmptyState } from '@/components/common/States'
import { Button } from '@/components/ui/button'
import { usePlaybookStore } from '@/components/common/playbooks/PlaybookStore'
import { FilterTabs } from '@/components/common/playbooks/FilterTabs'
import { ActivityFeed, type FeedItem } from '@/components/common/playbooks/ActivityFeed'
import { ActionComposerDialog, type ActionTarget } from '@/components/common/playbooks/ActionComposerDialog'
import { DomainBadge, SuggestedAction } from '@/components/common/playbooks/PlaybookBadges'
import type { ActionRequest } from '@/types/playbooks'

type View = 'pending' | 'all'

interface ActionCardData extends ActionTarget {
  key: string
  actioned: boolean
}

export default function PlaybookActionsPage() {
  const paths = usePaths()
  const store = usePlaybookStore()
  const { playbooks, executions } = store

  const [view, setView] = useState<View>('pending')
  const [target, setTarget] = useState<ActionTarget | null>(null)

  const cards: ActionCardData[] = playbooks.flatMap((playbook) => {
    const execution = executions[playbook.id]?.[0]
    if (!execution || execution.status !== 'attention') return []
    const profile = insightProfile(playbook)
    return profile.findings.map((finding, findingIndex) => ({
      key: `${execution.id}:${findingIndex}`,
      playbook,
      execution,
      profile,
      finding,
      findingIndex,
      actioned: execution.actioned.includes(findingIndex),
    }))
  })
  const pending = cards.filter((card) => !card.actioned)
  const shown = view === 'pending' ? pending : cards

  const feed: FeedItem[] = playbooks
    .flatMap((playbook) => (executions[playbook.id] ?? []).map((execution, index) => ({ playbook, execution, index })))
    .sort((a, b) => a.index - b.index)
    .flatMap(({ playbook, execution }) => execution.activity.map((item) => ({ ...item, playbook: playbook.name })))

  const send = (action: ActionTarget, request: ActionRequest) => {
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
        crumbs={[{ label: 'Playbooks', to: paths.playbooks }, { label: 'Actions' }]}
        title="Actions"
        actions={
          <FilterTabs
            label="Filter findings"
            value={view}
            onChange={setView}
            options={[
              { value: 'pending', label: 'Needs action', count: pending.length },
              { value: 'all', label: 'All activity', count: cards.length },
            ]}
          />
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          {shown.length === 0 ? (
            <Section className="mt-0">
              <EmptyState icon={CheckCheck} title="Nothing needs action" />
            </Section>
          ) : (
            shown.map((card) => (
              <article key={card.key} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1 space-y-2">
                  <DomainBadge domain={card.playbook.domainLabel} tone={card.playbook.tone} />
                  <h3 className="text-sm font-semibold text-card-foreground">
                    {card.finding.title}
                    <span className="font-normal text-muted-foreground">
                      {' · '}
                      <Link to={paths.playbook(card.playbook.id)} className="hover:text-primary">
                        {card.playbook.name}
                      </Link>
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground">{card.finding.description}</p>
                  <SuggestedAction>{suggestedAction(card.profile, card.finding)}</SuggestedAction>
                </div>
                <div className="shrink-0">
                  {card.actioned ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                      <Check className="size-3.5" aria-hidden />
                      Action sent
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => setTarget(card)}>
                      <Send aria-hidden />
                      Take action
                    </Button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <Section
          className="mt-0 lg:sticky lg:top-6"
          title="Recent activity"
          bodyClassName="max-h-[36rem] overflow-y-auto"
        >
          <ActivityFeed items={feed} empty="No activity yet." />
        </Section>
      </div>

      <ActionComposerDialog target={target} onClose={() => setTarget(null)} onSend={send} />
    </Page>
  )
}
