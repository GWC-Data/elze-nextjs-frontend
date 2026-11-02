'use client'

import { useState } from 'react'
import { Building2, Coins, Plus, TrendingUp, Wallet } from 'lucide-react'
import { listCompanyCredits } from '@/api/credits.api'
import { Page, PageHeader, Section } from '@/components/common/Page'
import { StatCard } from '@/components/common/StatCard'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import { CompanyAvatar } from '@/components/common/CompanyAvatar'
import { CompanyCreditsPanel } from '@/components/common/credits/CompanyCreditsPanel'
import { LOW_BALANCE } from '@/constants/credits'
import { AllocateCreditsDialog } from '@/components/common/credits/CreditDialogs'
import { CreditRatesTable } from '@/components/common/credits/CreditTables'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { refreshCreditRates, useCredits } from '@/hooks/useCredits'
import { useServerList } from '@/hooks/useServerList'
import { creditLabel, formatCredits, formatDateTime, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CompanyCredits } from '@/types/credits'

type PlatformTab = 'companies' | 'prices'

export default function PlatformCreditsPage() {
  const [tab, setTab] = useState<PlatformTab>('companies')
  const [allocating, setAllocating] = useState<CompanyCredits | null>(null)
  const [viewing, setViewing] = useState<CompanyCredits | null>(null)
  const [panelKey, setPanelKey] = useState(0)
  const { rates } = useCredits()

  const list = useServerList(listCompanyCredits, { page: 1, pageSize: 15, sort: 'name', dir: 'asc' })
  const totals = list.data?.totals ?? null

  const columns: ColumnDef<CompanyCredits>[] = [
    {
      key: 'name',
      header: 'Company',
      serverSort: 'name',
      render: (company) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <CompanyAvatar name={company.name} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium text-foreground">
              {company.name}
              {!company.active && (
                <Badge variant="outline" className="text-muted-foreground">
                  Suspended
                </Badge>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">{company.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      width: 'w-32',
      serverSort: 'balance',
      render: (company) => (
        <span
          className={cn(
            'text-sm font-medium tabular-nums',
            company.balance <= 0
              ? 'text-destructive'
              : company.balance < LOW_BALANCE
                ? 'text-warning-foreground dark:text-warning'
                : 'text-foreground'
          )}
        >
          {formatCredits(company.balance)}
        </span>
      ),
    },
    {
      key: 'used',
      header: 'Used in total',
      align: 'right',
      width: 'w-36',
      serverSort: 'used',
      render: (company) => <span className="text-sm tabular-nums">{formatCredits(company.used)}</span>,
    },
    {
      key: 'allocated',
      header: 'Added in total',
      align: 'right',
      width: 'w-36',
      secondary: true,
      serverSort: 'allocated',
      render: (company) => (
        <span className="text-sm tabular-nums text-muted-foreground">{formatCredits(company.allocated)}</span>
      ),
    },
    {
      key: 'lastUsedAt',
      header: 'Last used',
      width: 'w-32',
      secondary: true,
      serverSort: 'lastUsedAt',
      render: (company) => (
        <span className="text-sm text-muted-foreground" title={formatDateTime(company.lastUsedAt)}>
          {company.lastUsedAt ? formatRelativeTime(company.lastUsedAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: 'w-36',
      render: (company) => (
        <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => setAllocating(company)}>
            <Plus aria-hidden />
            Credits
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageHeader title="Credits" description="Give companies credits and see how they are used." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Balance across companies" value={totals?.balance ?? null} loading={list.loading} icon={Wallet} />
        <StatCard label="Used in total" value={totals?.used ?? null} loading={list.loading} icon={TrendingUp} />
        <StatCard label="Added in total" value={totals?.allocated ?? null} loading={list.loading} icon={Coins} />
        <StatCard
          label="Companies with credits"
          value={totals?.companies ?? null}
          loading={list.loading}
          icon={Building2}
        />
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as PlatformTab)} className="mt-6 gap-4">
        <TabsList variant="line">
          <TabsTrigger value="companies">
            <Building2 aria-hidden />
            Companies
          </TabsTrigger>
          <TabsTrigger value="prices">
            <Coins aria-hidden />
            Prices
          </TabsTrigger>
        </TabsList>
        <TabsContent value="companies">
          <Section flush className="mt-0">
            <DataTable
              data={list.error ? null : (list.data?.items ?? null)}
              columns={columns}
              keyOf={(company) => company.id}
              loading={list.loading}
              error={list.error}
              onRetry={list.reload}
              onRowClick={(company) => setViewing(company)}
              searchPlaceholder="Search companies…"
              server={{
                total: list.data?.total ?? 0,
                query: list.query,
                onQueryChange: list.setQuery,
                narrowed: list.narrowed,
              }}
              empty={{ title: 'No companies yet' }}
            />
          </Section>
        </TabsContent>
        <TabsContent value="prices">
          <Section flush className="mt-0">
            <CreditRatesTable rates={rates} editable onChanged={() => void refreshCreditRates()} />
          </Section>
        </TabsContent>
      </Tabs>

      <Sheet open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-5xl">
          {viewing && (
            <>
              <SheetHeader className="flex-row items-center justify-between gap-3 border-b pr-12">
                <div className="min-w-0">
                  <SheetTitle className="truncate">{viewing.name}</SheetTitle>
                  <SheetDescription>{creditLabel(viewing.balance)} left</SheetDescription>
                </div>
                <Button size="sm" onClick={() => setAllocating(viewing)}>
                  <Plus aria-hidden />
                  Credits
                </Button>
              </SheetHeader>
              <div className="p-4 sm:p-6">
                <CompanyCreditsPanel key={`${viewing.id}:${panelKey}`} companyId={viewing.id} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {allocating && (
        <AllocateCreditsDialog
          company={allocating}
          onClose={() => setAllocating(null)}
          onDone={(balance) => {
            setAllocating(null)
            list.reload()
            setPanelKey((n) => n + 1)
            setViewing((current) => (current && current.id === allocating.id ? { ...current, balance } : current))
          }}
        />
      )}
    </Page>
  )
}
