import { useMemo, useState } from 'react'
import { BarChart3, Table2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/common/Hint'
import { formatCredits } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CreditOverview } from '@/types/credits'

const SERIES = ['var(--credit-series-1)', 'var(--credit-series-2)', 'var(--credit-series-3)']

const SERIES_TOKENS =
  '[--credit-series-1:#2a78d6] [--credit-series-2:#eb6834] [--credit-series-3:#1baf7a] dark:[--credit-series-1:#3987e5] dark:[--credit-series-2:#d95926] dark:[--credit-series-3:#199e70]'

type Row = { day: string; label: string; total: number } & Record<string, number | string>

function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function UsageTooltip({
  active,
  payload,
  series,
}: Partial<TooltipContentProps<number, string>> & { series: { action: string; label: string; color: string }[] }) {
  const row = payload?.[0]?.payload as Row | undefined
  if (!active || !row) return null
  return (
    <div className="min-w-44 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-foreground">{row.label}</p>
      <ul className="space-y-1">
        {series.map((s) => (
          <li key={s.action} className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-[2px]" style={{ background: s.color }} aria-hidden />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums text-foreground">{formatCredits(Number(row[s.action] ?? 0))}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 flex justify-between border-t pt-1.5 font-medium text-foreground">
        <span>Total</span>
        <span className="tabular-nums">{formatCredits(row.total)}</span>
      </p>
    </div>
  )
}

export function CreditUsageChart({ daily }: { daily: CreditOverview['daily'] }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const series = useMemo(
    () => daily.actions.map((a, index) => ({ ...a, color: SERIES[index % SERIES.length] })),
    [daily.actions]
  )

  const rows = useMemo<Row[]>(() => {
    const byDay = new Map<string, Row>(
      daily.days.map((day) => [
        day,
        { day, label: dayLabel(day), total: 0, ...Object.fromEntries(daily.actions.map((a) => [a.action, 0])) },
      ])
    )
    for (const entry of daily.usage) {
      const row = byDay.get(entry.day)
      if (!row) continue
      row[entry.action] = Number(row[entry.action] ?? 0) + entry.credits
      row.total = Math.round((row.total + entry.credits) * 100) / 100
    }
    return [...byDay.values()]
  }, [daily])

  const used = rows.filter((row) => row.total !== 0)

  return (
    <div className={cn(SERIES_TOKENS)}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {series.map((s) => (
            <li key={s.action} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden />
              {s.label}
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          <Hint label="Chart">
            <Button
              size="icon-sm"
              variant={view === 'chart' ? 'secondary' : 'ghost'}
              aria-label="Show as chart"
              aria-pressed={view === 'chart'}
              onClick={() => setView('chart')}
            >
              <BarChart3 aria-hidden />
            </Button>
          </Hint>
          <Hint label="Table">
            <Button
              size="icon-sm"
              variant={view === 'table' ? 'secondary' : 'ghost'}
              aria-label="Show as table"
              aria-pressed={view === 'table'}
              onClick={() => setView('table')}
            >
              <Table2 aria-hidden />
            </Button>
          </Hint>
        </div>
      </div>

      {view === 'chart' ? (
        <div className="h-64 w-full" role="img" aria-label="Credits used per day over the last 30 days, by action">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals
                width={44}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={(value: number) => formatCredits(value)}
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
                content={(props) => <UsageTooltip {...props} series={series} />}
              />
              {series.map((s, index) => (
                <Bar
                  key={s.action}
                  dataKey={s.action}
                  name={s.label}
                  stackId="usage"
                  fill={s.color}
                  stroke="var(--card)"
                  strokeWidth={1}
                  maxBarSize={24}
                  radius={index === series.length - 1 ? [4, 4, 0, 0] : 0}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : used.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No credits used in the last 30 days.</p>
      ) : (
        <div className="max-h-64 overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/60 text-xs text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Day</th>
                {series.map((s) => (
                  <th key={s.action} className="px-3 py-2 text-right font-medium">
                    {s.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...used].reverse().map((row) => (
                <tr key={row.day} className="border-t">
                  <td className="px-3 py-1.5 text-foreground">{row.label}</td>
                  {series.map((s) => (
                    <td key={s.action} className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                      {formatCredits(Number(row[s.action] ?? 0))}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums text-foreground">
                    {formatCredits(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
