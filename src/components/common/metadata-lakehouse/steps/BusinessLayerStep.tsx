import { useMemo, useRef } from 'react'
import { AlertCircle, Check, Loader2, Paperclip, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { notify } from '@/lib/notify'
import { formatRelativeTime } from '@/lib/format'
import { endpoints } from '@/api/endpoints'
import { errorMessage } from '@/api/client'
import { ExtractionStoppedError } from '@/api/extraction.api'
import type { BusinessContextOutcome } from '@/api/extraction.api'
import { useAuth } from '@/context/authContext'
import { useWorkflow } from '@/context/workflowContext'
import {
  useApplyBusinessContext,
  useConnection,
  useExtraction,
  useProfileOverview,
  useRunExtraction,
  useTableProfile,
} from '@/hooks/useMetadataLakehouse'
import { useCreditCheck } from '@/hooks/useCredits'
import { Hint } from '@/components/common/Hint'
import { CreditCost } from '@/components/common/credits/CreditCost'
import { StepFrame } from '@/components/common/metadata-lakehouse/StepFrame'
import { StopExtractionButton } from '@/components/common/metadata-lakehouse/StopExtraction'
import {
  reportExtractionError,
  reportUnconfirmedExtraction,
} from '@/components/common/metadata-lakehouse/reportExtractionError'
import {
  EmptyState,
  ErrorState,
  NoConnectionState,
  QueryBoundary,
} from '@/components/common/metadata-lakehouse/DataStates'
import { AttachedFiles } from '@/components/common/metadata-lakehouse/business-layer/AttachedFiles'
import { TablesPanel } from '@/components/common/metadata-lakehouse/business-layer/TablesPanel'
import { DatasetOverviewSection } from '@/components/common/metadata-lakehouse/business-layer/DatasetOverviewSection'
import {
  ATTACHMENT_ACCEPT,
  useAttachments,
} from '@/components/common/metadata-lakehouse/business-layer/useAttachments'
import {
  useBusinessLayerDraft,
  type SaveState,
} from '@/components/common/metadata-lakehouse/business-layer/useBusinessLayerDraft'
import { composeBusinessBrief } from '@/components/common/metadata-lakehouse/business-layer/businessBrief'

function reportBusinessContext(outcome: BusinessContextOutcome | undefined): boolean {
  if (!outcome || outcome.status === 'applied') return false
  if (outcome.status === 'stopped') {
    notify.info('Business layer not applied.', 'The analysis stopped before it was applied. Run Analyse with AI again to apply it.')
  } else {
    notify.warning('Business layer not applied.', `${outcome.error} Run Analyse with AI again to apply it.`)
  }
  return true
}

function SaveStatus({
  state,
  updatedAt,
  error,
  onRetry,
}: {
  state: SaveState
  updatedAt: string | null
  error: unknown
  onRetry: () => void
}) {
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive" role="status">
        <AlertCircle className="size-3.5" aria-hidden />
        <Hint label={errorMessage(error, 'The server did not accept the change.')}>
          <span>Not saved</span>
        </Hint>
        <button type="button" onClick={onRetry} className="font-medium underline-offset-2 hover:underline">
          Retry
        </button>
      </span>
    )
  }
  if (state === 'pending' || state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Saving...
      </span>
    )
  }
  if (state === 'saved' || updatedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
        <Check className="size-3.5" aria-hidden />
        {state === 'saved' ? 'Saved' : `Saved ${formatRelativeTime(updatedAt)}`}
      </span>
    )
  }
  return null
}

function BusinessLayerSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the business layer...</span>
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="space-y-2 rounded-xl border bg-card p-4 shadow-xs">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-5 h-28 w-full" />
          <Skeleton className="mt-5 h-72 w-full" />
        </div>
      </div>
    </div>
  )
}

export function BusinessLayerStep() {
  const { connectionId, activeTableId, setActiveTableId, goToStep, next, readOnly } = useWorkflow()
  const { user } = useAuth()
  const overview = useProfileOverview(connectionId)
  const connection = useConnection(connectionId)
  const runExtraction = useRunExtraction(connectionId)
  const applyContext = useApplyBusinessContext(connectionId)
  const saved = useExtraction(connectionId, !readOnly)
  const draft = useBusinessLayerDraft(connectionId, readOnly)
  const attachments = useAttachments()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tables = useMemo(() => overview.data?.datasets.flatMap((d) => d.tables) ?? [], [overview.data])
  const tableId = tables.some((t) => t.id === activeTableId) ? activeTableId : (tables[0]?.id ?? null)
  const table = tables.find((t) => t.id === tableId) ?? null
  const profile = useTableProfile(connectionId, tableId)
  const datasetIds = useMemo(
    () => (connection.data?.selectedDatasets ?? []).map((d) => d.id),
    [connection.data]
  )

  const reusable = useMemo(() => {
    const run = saved.data
    if (!run) return false
    if (!run.datasetIds) return true
    const a = [...run.datasetIds].sort()
    const b = [...datasetIds].sort()
    return a.length === b.length && a.every((id, i) => id === b[i])
  }, [saved.data, datasetIds])

  const { layer } = draft
  const organizationName = draft.query.data?.organizationName ?? user?.companyName ?? null
  const brief = useMemo(
    () => composeBusinessBrief(layer, { organizationName, tables }),
    [layer, organizationName, tables]
  )

  const layerUpdatedAt = draft.query.data?.updatedAt ?? null
  const extractedAt = saved.data?.extractedAt ?? null
  const changedSinceAnalysis =
    draft.edited || Boolean(layerUpdatedAt && (!extractedAt || Date.parse(layerUpdatedAt) > Date.parse(extractedAt)))

  const needsExtraction = !reusable || attachments.files.length > 0
  const needsContext = !needsExtraction && changedSinceAnalysis && brief !== '' && Boolean(saved.data?.sessionId)
  const runs = needsExtraction ? (brief ? 2 : 1) : needsContext ? 1 : 0
  const credit = useCreditCheck('context.build', Math.max(runs, 1))
  const busy = runExtraction.isPending || applyContext.isPending

  const setTableOverview = (id: string, text: string) =>
    draft.update((current) => ({ ...current, tables: { ...current.tables, [id]: text } }))

  const analyse = async (): Promise<boolean> => {
    try {
      const result = await runExtraction.mutateAsync({
        datasetIds,
        files: attachments.files,
        businessContext: brief || undefined,
      })
      reportUnconfirmedExtraction(result)
      attachments.clear()
      if (reportBusinessContext(result.businessContext)) await draft.touch()
      else draft.markAnalysed()
      return true
    } catch (err) {
      reportExtractionError(err)
      return false
    }
  }

  const applyOnly = async (): Promise<boolean> => {
    const run = saved.data
    if (!run) return true
    try {
      await applyContext.mutateAsync({ sessionId: run.sessionId, report: run.text, datasetIds, request: brief })
      draft.markAnalysed()
      notify.success('Business layer applied.', 'Descriptions, glossary terms and metrics now follow your business layer.')
      return true
    } catch (err) {
      if (err instanceof ExtractionStoppedError) {
        notify.info('Stopped.', 'The business layer was not applied.')
      } else {
        notify.failure('apply the business layer', err)
      }
      return false
    }
  }

  const rerun = async () => {
    if (!(await draft.flush())) return
    if (await analyse()) next()
  }

  if (!connectionId) {
    return (
      <StepFrame title="Business Layer" hideNext>
        <NoConnectionState onConnect={() => goToStep('connect')} />
      </StepFrame>
    )
  }

  const applying = applyContext.isPending

  return (
    <StepFrame
      title="Business Layer"
      description="Describe each selected table in your own words so the analyst agent understands your data and answers accurately."
      nextLabel={runs > 0 ? 'Analyse with AI' : 'Next'}
      nextExtra={runs > 0 ? <CreditCost action="context.build" runs={runs} onPrimary /> : undefined}
      nextPending={busy}
      nextDisabled={datasetIds.length === 0 || (runs > 0 && credit.short)}
      pendingLabel="Analysing..."
      pendingOverlay={
        applying
          ? {
              title: 'Applying your business layer',
              detail:
                'The AI is updating table descriptions, glossary terms and metrics from your business layer. This usually takes a minute or two. Keep this tab open.',
              action: <StopExtractionButton run={applyContext} />,
            }
          : {
              title: 'Analysing your data with AI',
              detail: `Reading ${datasetIds.length} dataset${datasetIds.length === 1 ? '' : 's'}${
                attachments.files.length
                  ? ` and ${attachments.files.length} attached file${attachments.files.length === 1 ? '' : 's'}`
                  : ''
              }${brief ? ' with your business layer' : ''} to build the business glossary, metrics and relationships. This can take a few minutes. Keep this tab open.`,
              action: <StopExtractionButton run={runExtraction} />,
            }
      }
      onNext={async () => {
        if (!(await draft.flush())) {
          notify.error("Your business layer couldn't be saved.", 'Check your connection, then try again.')
          return false
        }
        if (needsExtraction) return analyse()
        if (needsContext) return applyOnly()
        return true
      }}
      refreshing={overview.isFetching && !overview.isPending}
      actions={
        readOnly ? undefined : (
          <>
            <Hint label="Attach reference files for the AI analysis">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                <Paperclip className="size-4" aria-hidden />
                Attach files
              </Button>
            </Hint>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={(event) => {
                attachments.add(event.target.files)
                event.target.value = ''
              }}
            />
            {reusable ? (
              <Button variant="outline" size="sm" onClick={rerun} disabled={busy || credit.short}>
                {runExtraction.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-4" aria-hidden />
                )}
                Re-run AI analysis
              </Button>
            ) : null}
          </>
        )
      }
      headerExtra={
        readOnly ? undefined : (
          <SaveStatus
            state={draft.saveState}
            updatedAt={layerUpdatedAt}
            error={draft.saveError}
            onRetry={() => void draft.flush()}
          />
        )
      }
      footerNote={
        runs > 0 && credit.reason
          ? credit.reason
          : needsContext
            ? 'The business layer changed since the last analysis. Analyse with AI applies it without re-reading the data.'
            : !needsExtraction && extractedAt
              ? `AI analysis saved ${formatRelativeTime(extractedAt)} · Next opens it without re-running`
              : undefined
      }
    >
      <QueryBoundary
        query={overview}
        step="Business Layer"
        endpoint={`GET ${endpoints.context.profileOverview(connectionId)}`}
        context="load the selected datasets"
        loading={<BusinessLayerSkeleton />}
        isEmpty={(d) => d.datasets.length === 0}
        empty={
          <EmptyState
            title="No datasets selected"
            detail="Choose datasets in the Discover step, then describe them here."
            action={
              <Button variant="outline" size="sm" onClick={() => goToStep('discover')}>
                Go to Discover
              </Button>
            }
          />
        }
      >
        {() =>
          draft.query.isError ? (
            <ErrorState
              context="load the business layer"
              error={draft.query.error}
              onRetry={() => draft.query.refetch()}
            />
          ) : !draft.ready ? (
            <BusinessLayerSkeleton />
          ) : (
            <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
              {table ? <TablesPanel tables={tables} activeTableId={table.id} onSelect={setActiveTableId} /> : null}
              <div className="flex min-w-0 flex-col gap-4">
                <AttachedFiles files={attachments.files} onRemove={attachments.remove} disabled={busy} />
                {table ? (
                  <DatasetOverviewSection
                    tableId={table.id}
                    tableName={table.name}
                    overview={layer.tables[table.id] ?? ''}
                    onChange={(text) => setTableOverview(table.id, text)}
                    columns={profile.data?.columns ?? []}
                    columnsLoading={profile.isPending}
                    columnsFailed={profile.isError}
                    onRetryColumns={() => void profile.refetch()}
                    readOnly={readOnly}
                  />
                ) : null}
              </div>
            </div>
          )
        }
      </QueryBoundary>
    </StepFrame>
  )
}
