import { useState } from 'react'
import type { ComponentType } from 'react'
import {
  Check,
  ChevronDown,
  CircleCheck,
  Compass,
  GitBranch,
  GitCompareArrows,
  Loader2,
  Search,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WARNING_TEXT } from '@/components/common/playbooks/PlaybookBadges'
import { RichText } from '@/components/common/playbooks/RichText'
import type { TraceStatus, TraceStep } from '@/types/playbooks'

const STATUS: Record<TraceStatus, { label: string; icon: ComponentType<{ className?: string }>; tone: string }> = {
  exploring: { label: 'Exploring', icon: Compass, tone: 'text-violet-600 dark:text-violet-400' },
  investigating: { label: 'Investigating', icon: Search, tone: 'text-info' },
  validating: { label: 'Validating', icon: ShieldCheck, tone: 'text-success' },
  'cross-checking': { label: 'Cross-checking', icon: GitCompareArrows, tone: WARNING_TEXT },
  resolved: { label: 'Resolved', icon: CircleCheck, tone: 'text-success' },
}

export function AgentThread({ steps, live = false, className }: { steps: TraceStep[]; live?: boolean; className?: string }) {
  return (
    <ol className={className}>
      {steps.map((step, index) => (
        <TraceEntry
          key={index}
          step={step}
          live={live && index === steps.length - 1}
          last={index === steps.length - 1}
        />
      ))}
    </ol>
  )
}

function TraceEntry({ step, live, last }: { step: TraceStep; live: boolean; last: boolean }) {
  const [open, setOpen] = useState(false)
  const style = STATUS[step.status]
  const Icon = live ? Loader2 : style.icon

  return (
    <li className={cn('relative flex gap-3', !last && 'pb-4', step.backtrack && 'opacity-75')}>
      {!last ? (
        <span
          className={cn('absolute top-8 bottom-1 left-[13.5px] w-px', step.backtrack ? 'border-l border-dashed' : 'bg-border')}
          aria-hidden
        />
      ) : null}
      <span className={cn('relative grid size-7 shrink-0 place-items-center rounded-full border bg-card', style.tone)}>
        <Icon className={cn('size-3.5', live && 'animate-spin')} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={cn('text-[11px] font-semibold tracking-wide uppercase', style.tone)}>{style.label}</span>
          <span className="min-w-0 flex-1 text-sm text-foreground">
            <RichText text={step.text} />
          </span>
          {step.time ? <span className="text-xs text-muted-foreground tabular-nums">{step.time}</span> : null}
        </div>

        {step.detail ? (
          <>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Details
              <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} aria-hidden />
            </button>
            {open ? <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p> : null}
          </>
        ) : null}

        {step.tools?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {step.tools.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
              >
                <Share2 className="size-3" aria-hidden />
                {tool}
              </span>
            ))}
          </div>
        ) : null}

        {step.branches?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {step.branches.map((branch) => {
              const BranchIcon = branch.state === 'strong' ? Check : branch.state === 'weak' ? X : GitBranch
              return (
                <span
                  key={branch.label}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
                    branch.state === 'strong' && 'border-success/30 bg-success/10 text-success',
                    branch.state === 'weak' && 'text-muted-foreground line-through',
                    branch.state === '' && 'text-foreground'
                  )}
                >
                  <BranchIcon className="size-3" aria-hidden />
                  {branch.label}
                </span>
              )
            })}
          </div>
        ) : null}
      </div>
    </li>
  )
}
