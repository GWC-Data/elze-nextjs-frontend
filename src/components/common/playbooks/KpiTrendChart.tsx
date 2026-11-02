import { cn } from '@/lib/utils'
import { formatKpi } from '@/lib/playbookInsights'
import type { Execution, InsightProfile } from '@/types/playbooks'

const WIDTH = 680
const HEIGHT = 230
const PAD = { left: 64, right: 24, top: 24, bottom: 34 }
const GRID_ROWS = 4

export function KpiTrendChart({
  executions,
  profile,
  selectedId,
  onSelect,
}: {
  executions: Execution[]
  profile: InsightProfile
  selectedId: string
  onSelect?: (executionId: string) => void
}) {
  const ordered = [...executions].reverse()
  const values = ordered.map((execution) => execution.kpiValue)
  const rawMax = Math.max(...values)
  const rawMin = Math.min(...values)
  const span = rawMax - rawMin || 1
  const max = rawMax + span * 0.25
  const min = Math.max(0, rawMin - span * 0.25)
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const stepX = (WIDTH - PAD.left - PAD.right) / Math.max(1, values.length - 1)
  const points = values.map((value, index) => ({
    x: PAD.left + index * stepX,
    y: PAD.top + plotHeight * (1 - (value - min) / (max - min)),
  }))
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const area = `${line} L${points[points.length - 1].x.toFixed(1)},${HEIGHT - PAD.bottom} L${points[0].x.toFixed(1)},${HEIGHT - PAD.bottom} Z`

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${profile.kpiLabel} across the last ${ordered.length} executions`}
    >
      {Array.from({ length: GRID_ROWS + 1 }, (_, row) => {
        const y = PAD.top + plotHeight * (row / GRID_ROWS)
        const value = max - (max - min) * (row / GRID_ROWS)
        return (
          <g key={row}>
            <line x1={PAD.left} y1={y} x2={WIDTH - PAD.right} y2={y} className="stroke-border" strokeWidth="1" />
            <text x={PAD.left - 10} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
              {formatKpi(profile, value)}
            </text>
          </g>
        )
      })}

      <path d={area} className="fill-primary" opacity="0.1" />
      <path d={line} fill="none" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((point, index) => {
        const execution = ordered[index]
        const anomaly = execution.status === 'attention'
        const selected = execution.id === selectedId
        return (
          <g
            key={execution.id}
            className={cn(onSelect && 'cursor-pointer')}
            onClick={onSelect ? () => onSelect(execution.id) : undefined}
          >
            {selected ? (
              <circle cx={point.x} cy={point.y} r="11" fill="none" className="stroke-primary" strokeWidth="1.5" strokeDasharray="3 3" />
            ) : null}
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              className={cn(anomaly ? 'fill-destructive' : 'fill-primary', 'stroke-card')}
              strokeWidth="2"
            />
            {anomaly || index === points.length - 1 ? (
              <text x={point.x} y={point.y - 14} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">
                {formatKpi(profile, execution.kpiValue)}
              </text>
            ) : null}
            <text x={point.x} y={HEIGHT - 10} textAnchor="middle" className="fill-muted-foreground text-[11px]">
              {execution.when.split(',')[0]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
