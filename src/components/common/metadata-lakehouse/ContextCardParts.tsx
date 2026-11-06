import type { ComponentType, ReactNode } from 'react'
import { Building2, Lock, ShieldCheck, UsersRound } from 'lucide-react'
import { Hint } from '@/components/common/Hint'
import { WORKFLOW_STEPS, stepIndex } from '@/context/workflowContext'
import { CONTEXT_ACCESS_LABELS } from '@/lib/contextAccess'
import { cn } from '@/lib/utils'
import type { ContextAccess, WorkflowStepId } from '@/types/metadataLakehouse'

const PERSON_TONES = [
  'bg-primary/10 text-primary',
  'bg-info/10 text-info',
  'bg-success/10 text-success',
  'bg-warning/15 text-warning-foreground',
]

export function initials(name: string): string {
  const words = name.trim().split(/[\s._-]+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : name.trim().slice(0, 2)
  return (letters || '?').toUpperCase()
}

export function personTone(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return PERSON_TONES[hash % PERSON_TONES.length]
}

export function PersonAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold',
        personTone(name),
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: ReactNode
  hint?: ReactNode
}) {
  const content = (
    <div className="min-w-0 rounded-xl border bg-muted/30 px-3 py-2.5">
      <p className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  )
  return hint ? <Hint label={hint}>{content}</Hint> : content
}

export function StatusPill({ connected, busy = false }: { connected: boolean; busy?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        connected
          ? 'border-success/25 bg-success/10 text-success'
          : 'border-destructive/25 bg-destructive/10 text-destructive'
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          connected ? 'bg-success' : 'bg-destructive',
          busy && 'animate-pulse'
        )}
        aria-hidden
      />
      {busy ? 'Checking…' : connected ? 'Connected' : 'Not working'}
    </span>
  )
}

export function LivePill({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
      <span className="relative flex size-1.5" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-success" />
      </span>
      Live {label}
    </span>
  )
}

export function OwnerChip({ access }: { access: ContextAccess | null | undefined }) {
  const owner = access?.isOwner ? 'You' : (access?.owner?.name ?? 'Former user')
  return (
    <span className="flex min-w-0 items-center gap-2 text-xs">
      <PersonAvatar name={access?.owner?.name ?? owner} className="size-6 text-[10px]" />
      <span className="min-w-0 truncate">
        <span className="text-muted-foreground">Owner </span>
        <span className="font-medium text-foreground">{owner}</span>
      </span>
    </span>
  )
}

const chip = 'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium'

export function SharingChip({ access, platform }: { access: ContextAccess | null | undefined; platform: boolean }) {
  if (!access) return null
  const shared = access.sharedWith ?? 0
  if (!platform && access.generalAccess === 'company') {
    return (
      <span className={cn(chip, 'border-success/25 bg-success/10 text-success')}>
        <Building2 className="size-3" aria-hidden />
        Everyone in the company
      </span>
    )
  }
  if (shared > 0) {
    return (
      <span className={cn(chip, 'border-info/25 bg-info/10 text-info')}>
        <UsersRound className="size-3" aria-hidden />
        Shared with {shared}
      </span>
    )
  }
  return (
    <span className={cn(chip, 'text-muted-foreground')}>
      <Lock className="size-3" aria-hidden />
      {platform ? 'Platform only' : 'Restricted'}
    </span>
  )
}

export function LevelChip({ access }: { access: ContextAccess | null | undefined }) {
  if (!access || access.isOwner || access.level === 'full') return null
  return (
    <span className={cn(chip, 'text-muted-foreground')}>
      <ShieldCheck className="size-3" aria-hidden />
      {CONTEXT_ACCESS_LABELS[access.level]}
    </span>
  )
}

export function StepProgress({ step }: { step: string | null }) {
  const known = WORKFLOW_STEPS.some((s) => s.id === step)
  const index = known ? stepIndex(step as WorkflowStepId) : 0
  const current = WORKFLOW_STEPS[index]
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-medium text-foreground">{current.label}</span>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          Step {index + 1} of {WORKFLOW_STEPS.length}
        </span>
      </div>
      <div className="mt-1.5 flex gap-1" aria-hidden>
        {WORKFLOW_STEPS.map((s, i) => (
          <span
            key={s.id}
            className={cn('h-1.5 flex-1 rounded-full', i < index ? 'bg-primary' : i === index ? 'bg-primary/50' : 'bg-muted')}
          />
        ))}
      </div>
    </div>
  )
}
