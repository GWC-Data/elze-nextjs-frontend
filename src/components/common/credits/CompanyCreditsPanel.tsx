import { useState } from 'react'
import { Activity, BadgeDollarSign, Coins, Receipt, TrendingUp, Users } from 'lucide-react'
import { getCreditOverview } from '@/api/credits.api'
import { Section } from '@/components/common/Page'
import { StatCard } from '@/components/common/StatCard'
import { ErrorState } from '@/components/common/States'
import { CreditUsageChart } from '@/components/common/credits/CreditUsageChart'
import { CreditActivityTable, CreditMembersTable, CreditRatesTable } from '@/components/common/credits/CreditTables'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LOW_BALANCE } from '@/constants/credits'
import { useAsync } from '@/hooks/useAsync'
import { refreshCreditRates, useCredits } from '@/hooks/useCredits'
import { creditLabel, formatCredits } from '@/lib/format'
import { cn } from '@/lib/utils'

type PanelTab = 'members' | 'activity' | 'prices'

export function CompanyCreditsPanel({
  companyId,
  showPrices = false,
  ratesEditable = false,
}: {
  companyId?: string
  showPrices?: boolean
  ratesEditable?: boolean
}) {
  const overview = useAsync(() => getCreditOverview(companyId), [companyId])
  const { rates } = useCredits()
  const [tab, setTab] = useState<PanelTab>('members')
  const data = overview.data

  if (overview.error) {
    return <ErrorState error={overview.error} title="Unable to load credits" onRetry={overview.reload} />
  }

  const loading = overview.loading
  const actions = data?.daily.actions ?? rates?.map((r) => ({ action: r.action, label: r.label })) ?? []
  const low = data !== null && data.balance < LOW_BALANCE
  const top = data ? [...data.byAction].filter((a) => a.credits > 0).sort((a, b) => b.credits - a.credits)[0] : undefined

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Balance"
          value={data?.balance ?? null}
          loading={loading}
          icon={Coins}
          hint={
            data ? (
              <span className={cn(low && 'font-medium text-warning-foreground dark:text-warning')}>
                {low ? 'Running low · ' : ''}
                {formatCredits(data.allocated)} added in total
              </span>
            ) : undefined
          }
        />
        <StatCard
          label="Used in total"
          value={data?.used ?? null}
          loading={loading}
          icon={TrendingUp}
          hint={data ? `${formatCredits(data.used30Days)} in the last 30 days` : undefined}
        />
        <StatCard
          label="AI actions"
          value={data?.runs ?? null}
          loading={loading}
          icon={Activity}
          hint={data && data.runs > 0 ? `${formatCredits(data.used / data.runs)} credits each on average` : undefined}
        />
        <StatCard
          label="Top action"
          value={data ? (top?.credits ?? 0) : null}
          loading={loading}
          icon={BadgeDollarSign}
          hint={data ? (top?.label ?? 'Nothing used yet') : undefined}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Section title="Daily usage" description="Last 30 days, by action" className="mt-0">
          {data ? <CreditUsageChart daily={data.daily} /> : <Skeleton className="h-72 w-full" />}
        </Section>
        <Section title="By action" description="Credits used in total" className="mt-0">
          {data ? (
            <ul className="space-y-3">
              {actions.map((a) => {
                const row = data.byAction.find((b) => b.action === a.action)
                const credits = row?.credits ?? 0
                const share = data.used > 0 ? (credits / data.used) * 100 : 0
                return (
                  <li key={a.action}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate text-foreground">{a.label}</span>
                      <span className="shrink-0 tabular-nums">
                        <span className="font-medium text-foreground">{formatCredits(credits)}</span>
                        <span className="text-muted-foreground"> · {row?.runs ?? 0}×</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                    </div>
                  </li>
                )
              })}
              <li className="flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium tabular-nums text-foreground">{creditLabel(data.used)}</span>
              </li>
            </ul>
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}
        </Section>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as PanelTab)} className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="members">
            <Users aria-hidden />
            Members
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Receipt aria-hidden />
            Activity
          </TabsTrigger>
          {showPrices && (
            <TabsTrigger value="prices">
              <Coins aria-hidden />
              Prices
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="members">
          <Section flush className="mt-0">
            <CreditMembersTable companyId={companyId} onChanged={overview.reload} />
          </Section>
        </TabsContent>
        <TabsContent value="activity">
          <Section flush className="mt-0">
            <CreditActivityTable companyId={companyId} actions={actions} />
          </Section>
        </TabsContent>
        {showPrices && (
          <TabsContent value="prices">
            <Section flush className="mt-0">
              <CreditRatesTable rates={rates} editable={ratesEditable} onChanged={() => void refreshCreditRates()} />
            </Section>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
