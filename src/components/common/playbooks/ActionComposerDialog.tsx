import { useId, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Bell, ExternalLink, Mail, MessageSquare, Send, Shield, User, Users, X } from 'lucide-react'
import { PEOPLE_DIRECTORY } from '@/constants/playbookSamples'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import {
  ACTION_CHANNELS,
  actionMessage,
  actionSubject,
  formatKpi,
  kpiChange,
  suggestedAction,
} from '@/lib/playbookInsights'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { AiBadge } from '@/components/common/playbooks/PlaybookBadges'
import type {
  ActionRequest,
  ChannelKey,
  Execution,
  Finding,
  InsightProfile,
  Person,
  PersonType,
  Playbook,
} from '@/types/playbooks'

export interface ActionTarget {
  playbook: Playbook
  execution: Execution
  profile: InsightProfile
  finding: Finding
  findingIndex: number
}

const CHANNEL_ICON: Record<ChannelKey, ComponentType<{ className?: string }>> = {
  email: Mail,
  teams: MessageSquare,
  slack: MessageSquare,
  inapp: Bell,
}

const PERSON_ICON: Record<PersonType, ComponentType<{ className?: string }>> = {
  role: Shield,
  team: Users,
  group: Users,
  individual: User,
}

export function ActionComposerDialog({
  target,
  onClose,
  onSend,
}: {
  target: ActionTarget | null
  onClose: () => void
  onSend: (target: ActionTarget, request: ActionRequest) => void
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {target ? (
          <Composer
            key={`${target.execution.id}:${target.findingIndex}`}
            target={target}
            onSend={(request) => onSend(target, request)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Section({ label, aside, children }: { label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        {aside}
      </div>
      {children}
    </div>
  )
}

function Composer({ target, onSend }: { target: ActionTarget; onSend: (request: ActionRequest) => void }) {
  const { playbook, execution, profile, finding } = target
  const snapshotId = useId()
  const defaults = finding.recipients ?? []
  const [channels, setChannels] = useState<ChannelKey[]>(['email', 'inapp'])
  const [recipients, setRecipients] = useState<Person[]>(() =>
    defaults
      .map((name) => PEOPLE_DIRECTORY.find((person) => person.name === name))
      .filter((person): person is Person => Boolean(person))
  )
  const [subject, setSubject] = useState(() => actionSubject(playbook, finding))
  const [message, setMessage] = useState(() => actionMessage(playbook, execution, profile, finding))
  const [query, setQuery] = useState('')
  const [snapshot, setSnapshot] = useState(true)

  const chosen = new Set(recipients.map((person) => person.name))
  const needle = query.trim().toLowerCase()
  const matches = needle
    ? PEOPLE_DIRECTORY.filter((person) => !chosen.has(person.name) && person.name.toLowerCase().includes(needle))
    : []
  const change = kpiChange(profile, execution.kpiValue)
  const recommendation = suggestedAction(profile, finding)

  const toggleChannel = (key: ChannelKey) =>
    setChannels((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]))

  const add = (person: Person) => {
    setRecipients((current) => (current.some((item) => item.name === person.name) ? current : [...current, person]))
    setQuery('')
  }

  const send = () => {
    if (channels.length === 0) {
      notify.error('Select at least one notification channel.')
      return
    }
    if (recipients.length === 0) {
      notify.error('Add at least one recipient.')
      return
    }
    onSend({ channels, recipients: recipients.map((person) => person.name), subject, message, snapshot })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Notify {defaults[0] ?? 'the responsible team'}</DialogTitle>
        <DialogDescription className="sr-only">Send this finding to the people who can act on it.</DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <dl className="space-y-3 rounded-lg border bg-muted/30 p-3 text-sm">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Finding</dt>
            <dd className="mt-0.5 text-foreground">
              {finding.title} — {finding.description}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Suggested action</dt>
            <dd className="mt-0.5 text-foreground">{recommendation}</dd>
          </div>
        </dl>

        <Section label="Channels">
          <div className="flex flex-wrap gap-2">
            {ACTION_CHANNELS.map((channel) => {
              const on = channels.includes(channel.key)
              const Icon = CHANNEL_ICON[channel.key]
              return (
                <button
                  key={channel.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleChannel(channel.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                    on
                      ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                      : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {channel.label}
                </button>
              )
            })}
          </div>
        </Section>

        <Section label="Message" aside={<AiBadge label="AI drafted" />}>
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Subject" className="font-medium" />
          <Textarea
            rows={8}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            aria-label="Message"
            className="text-sm leading-relaxed"
          />
        </Section>

        <Section label="Recipients">
          {recipients.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {recipients.map((person) => (
                <span
                  key={person.name}
                  className="inline-flex items-center gap-1 rounded-md border bg-muted/40 py-0.5 pr-1 pl-2 text-xs text-foreground"
                >
                  {person.name}
                  <button
                    type="button"
                    onClick={() => setRecipients((current) => current.filter((item) => item.name !== person.name))}
                    aria-label={`Remove ${person.name}`}
                    className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <div className="relative">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, teams, roles or groups…"
              aria-label="Add recipients"
              autoComplete="off"
            />
            {matches.length > 0 ? (
              <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
                {matches.map((person) => {
                  const Icon = PERSON_ICON[person.type]
                  return (
                    <li key={person.name}>
                      <button
                        type="button"
                        onClick={() => add(person)}
                        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-accent"
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-foreground">{person.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{person.sub}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        </Section>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch id={snapshotId} checked={snapshot} onCheckedChange={setSnapshot} />
            <Label htmlFor={snapshotId}>Include insight snapshot</Label>
          </div>
          {snapshot ? (
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{playbook.name}</span>
                <span className="text-xs font-medium text-warning-foreground dark:text-warning">Insight snapshot</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{profile.kpiLabel}</p>
                  <p className="font-semibold text-foreground tabular-nums">{formatKpi(profile, execution.kpiValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Variance</p>
                  <p className="font-semibold text-destructive tabular-nums">
                    {change.pct >= 0 ? '+' : ''}
                    {change.pct.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Finding:</span> {finding.title} — {finding.description}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Recommendation:</span> {recommendation}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
                <span>Execution: {execution.when}</span>
                <span className="inline-flex items-center gap-1">
                  <ExternalLink className="size-3" aria-hidden />
                  Linked to playbook execution
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <DialogFooter className="items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {recipients.length} recipient{recipients.length === 1 ? '' : 's'} selected
        </span>
        <Button onClick={send}>
          <Send aria-hidden />
          Send notification
        </Button>
      </DialogFooter>
    </>
  )
}
