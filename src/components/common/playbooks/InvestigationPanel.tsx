import { useEffect, useState } from 'react'
import { CircleCheck, Loader2, Search, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  currentTime,
  investigationOutcome,
  investigationSteps,
  investigationTitle,
} from '@/lib/playbookInsights'
import { Button } from '@/components/ui/button'
import { AgentThread } from '@/components/common/playbooks/AgentThread'
import type { InsightProfile } from '@/types/playbooks'

const STEP_DELAY = 620

export function InvestigationPanel({
  profile,
  anomaly,
  onJump,
}: {
  profile: InsightProfile
  anomaly: boolean
  onJump: (tab: 'findings' | 'recommendations') => void
}) {
  const [steps] = useState(() => investigationSteps(profile, anomaly))
  const [stamps, setStamps] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    const timer = window.setTimeout(
      () => {
        if (stamps.length < steps.length) setStamps((previous) => [...previous, currentTime()])
        else setDone(true)
      },
      stamps.length === 0 ? 0 : STEP_DELAY
    )
    return () => window.clearTimeout(timer)
  }, [stamps.length, steps.length, done])

  const visible = steps.slice(0, stamps.length).map((step, index) => ({ ...step, time: stamps[index] }))

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Investigation</p>
          <h2 className="text-sm font-semibold text-card-foreground">{investigationTitle(profile, anomaly)}</h2>
        </div>
        {done ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
            <CircleCheck className="size-3.5" aria-hidden />
            Resolved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-info">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Investigating
          </span>
        )}
      </header>

      <div className="space-y-5 p-5">
        <AgentThread steps={visible} live={!done} />

        {done && anomaly ? <InvestigationGraph profile={profile} /> : null}

        {done ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <p className="min-w-0 flex-1 text-sm text-foreground">{investigationOutcome(profile, anomaly)}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onJump('findings')}>
                <Search aria-hidden />
                View findings
              </Button>
              <Button size="sm" variant="outline" onClick={() => onJump('recommendations')}>
                <Target aria-hidden />
                Review recommendations
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function truncate(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text
}

function curve(x1: number, y1: number, x2: number, y2: number, bend: number) {
  return `M${x1},${y1} C ${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`
}

type NodeKind = 'root' | 'strong' | 'weak' | 'plain'

const NODE_CIRCLE: Record<NodeKind, string> = {
  root: 'fill-primary stroke-primary',
  strong: 'fill-card stroke-success',
  weak: 'fill-card stroke-muted-foreground/50',
  plain: 'fill-card stroke-border',
}

function GraphNode({ x, y, r, label, sub, kind }: { x: number; y: number; r: number; label: string; sub?: string; kind: NodeKind }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} strokeWidth="2" strokeDasharray={kind === 'weak' ? '3 3' : undefined} className={NODE_CIRCLE[kind]} />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className={cn('text-[10px] font-medium', kind === 'root' ? 'fill-primary-foreground' : 'fill-foreground')}
      >
        {label}
      </text>
      {sub ? (
        <text x={x} y={y + r + 12} textAnchor="middle" className="fill-muted-foreground text-[9px]">
          {sub}
        </text>
      ) : null}
    </g>
  )
}

function InvestigationGraph({ profile }: { profile: InsightProfile }) {
  const dimensions = profile.dimensions
  const count = Math.max(1, dimensions.length)
  const height = Math.max(190, count * 40 + 30)
  const width = 640
  const rootX = 40
  const rootY = height / 2
  const dimX = 250
  const childX = 470
  const outX = 590
  const dimY = (index: number) => (count === 1 ? height / 2 : 24 + (index * (height - 48)) / (count - 1))
  const findings = profile.findings
  const confirmed = findings[1] ?? findings[0]
  const dead = findings[findings.length - 1]
  const y0 = dimY(0)
  const upper = Math.max(30, y0 - 38)
  const lower = Math.min(height - 24, y0 + 38)

  return (
    <figure className="space-y-2 animate-in fade-in duration-500">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Investigation paths">
        {dimensions.map((dimension, index) => (
          <path
            key={dimension}
            d={curve(rootX, rootY, dimX, dimY(index), 80)}
            fill="none"
            strokeWidth={index === 0 ? 2 : 1.5}
            className={index === 0 ? 'stroke-primary' : 'stroke-border'}
          />
        ))}
        {confirmed ? (
          <path d={curve(dimX, y0, childX, upper, 80)} fill="none" strokeWidth="2" className="stroke-success" />
        ) : null}
        {dead && dead !== confirmed ? (
          <path d={curve(dimX, y0, childX, lower, 80)} fill="none" strokeWidth="1.5" strokeDasharray="4 4" className="stroke-muted-foreground/50" />
        ) : null}
        {confirmed ? (
          <>
            <path d={curve(childX, upper, outX, rootY, 30)} fill="none" strokeWidth="2" className="stroke-primary" />
            <path d={curve(outX, rootY, rootX, rootY, -30)} fill="none" strokeWidth="1.5" strokeDasharray="4 4" className="stroke-muted-foreground/40" />
          </>
        ) : null}

        <GraphNode x={rootX} y={rootY} r={19} label="Δ" kind="root" />
        {dimensions.map((dimension, index) => (
          <GraphNode
            key={dimension}
            x={dimX}
            y={dimY(index)}
            r={17}
            label={truncate(dimension, 11)}
            sub={profile.factorSkew[index] !== undefined ? `${profile.factorSkew[index]}% of Δ` : undefined}
            kind={index === 0 ? 'strong' : index === count - 1 ? 'weak' : 'plain'}
          />
        ))}
        {confirmed ? <GraphNode x={childX} y={upper} r={16} label={truncate(confirmed.title, 15)} kind="strong" /> : null}
        {dead && dead !== confirmed ? <GraphNode x={childX} y={lower} r={16} label={truncate(dead.title, 15)} kind="weak" /> : null}
        <GraphNode x={outX} y={rootY} r={18} label="Impact" kind="strong" />
      </svg>
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          Active path
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-success" aria-hidden />
          Confirmed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/50" aria-hidden />
          Ruled out
        </span>
      </figcaption>
    </figure>
  )
}
