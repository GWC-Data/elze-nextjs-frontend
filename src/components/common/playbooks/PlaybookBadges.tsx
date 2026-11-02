import type { ComponentType, ReactNode } from 'react'
import {
  CircleCheck,
  CirclePause,
  Flag,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Sparkles,
  TriangleAlert,
  Wand2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DomainTone, Level, PlaybookStatus, RunStatus } from '@/types/playbooks'

interface BadgeStyle {
  label: string
  icon: ComponentType<{ className?: string }>
  className: string
}

export const WARNING_TEXT = 'text-warning-foreground dark:text-warning'

const LEVEL_LABEL: Record<Level, string> = { high: 'High', medium: 'Medium', low: 'Low' }

const LEVEL_TEXT: Record<Level, string> = {
  high: 'text-destructive',
  medium: WARNING_TEXT,
  low: 'text-muted-foreground',
}

const TONE_DOT: Record<DomainTone, string> = {
  blue: 'bg-info',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
  green: 'bg-success',
}

const RUN_STATUS: Record<RunStatus, BadgeStyle> = {
  healthy: { label: 'Healthy', icon: CircleCheck, className: 'text-success' },
  attention: { label: 'Needs attention', icon: TriangleAlert, className: WARNING_TEXT },
}

const IMPACT_ICON: Record<Level, ComponentType<{ className?: string }>> = {
  high: SignalHigh,
  medium: SignalMedium,
  low: SignalLow,
}

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  healthy: RUN_STATUS.healthy.label,
  attention: RUN_STATUS.attention.label,
}

function StyledBadge({ style, className }: { style: BadgeStyle; className?: string }) {
  const Icon = style.icon
  return (
    <Badge variant="outline" className={cn('gap-1', style.className, className)}>
      <Icon className="size-3" aria-hidden />
      {style.label}
    </Badge>
  )
}

export function DomainBadge({ domain, tone, className }: { domain: string; tone: DomainTone; className?: string }) {
  return (
    <Badge variant="secondary" className={cn('gap-1.5', className)}>
      <span className={cn('size-1.5 shrink-0 rounded-full', TONE_DOT[tone])} aria-hidden />
      {domain}
    </Badge>
  )
}

export function PlaybookStatusBadge({ status, className }: { status: PlaybookStatus; className?: string }) {
  if (status === 'paused') {
    return <StyledBadge style={{ label: 'Paused', icon: CirclePause, className: WARNING_TEXT }} className={className} />
  }
  return (
    <Badge variant="outline" className={cn('gap-1.5 text-success', className)}>
      <span className="relative flex size-2" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      Active
    </Badge>
  )
}

export function RunStatusBadge({ status, className }: { status: RunStatus; className?: string }) {
  return <StyledBadge style={RUN_STATUS[status]} className={className} />
}

export function ImpactBadge({ impact, className }: { impact: Level; className?: string }) {
  return (
    <StyledBadge
      style={{ label: `${LEVEL_LABEL[impact]} impact`, icon: IMPACT_ICON[impact], className: LEVEL_TEXT[impact] }}
      className={className}
    />
  )
}

export function PriorityBadge({ priority, className }: { priority: Level; className?: string }) {
  return (
    <StyledBadge
      style={{ label: `${LEVEL_LABEL[priority]} priority`, icon: Flag, className: LEVEL_TEXT[priority] }}
      className={className}
    />
  )
}

export function AiBadge({ label = 'AI generated', className }: { label?: string; className?: string }) {
  return (
    <Badge variant="default" className={cn('gap-1 font-medium', className)}>
      <Sparkles className="size-3" aria-hidden />
      {label}
    </Badge>
  )
}

export function healthTone(value: number) {
  return value < 85 ? WARNING_TEXT : 'text-foreground'
}

export function HealthRing({ value, size = 'md', className }: { value: number; size?: 'sm' | 'md'; className?: string }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const low = value < 85
  return (
    <span
      className={cn('relative grid shrink-0 place-items-center', size === 'sm' ? 'size-9' : 'size-11', className)}
      role="img"
      aria-label={`Health ${value} out of 100`}
    >
      <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={radius} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className={low ? 'stroke-warning' : 'stroke-success'}
        />
      </svg>
      <span className={cn('font-semibold tabular-nums', size === 'sm' ? 'text-[11px]' : 'text-xs', low ? WARNING_TEXT : 'text-foreground')}>
        {value}
      </span>
    </span>
  )
}

export function SuggestedAction({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground',
        className
      )}
    >
      <Wand2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
