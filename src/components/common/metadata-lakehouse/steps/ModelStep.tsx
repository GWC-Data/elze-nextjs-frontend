import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import type { Edge, Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AlertTriangle, Database, Loader2, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { AdkApiError, errorMessage } from '@/api/client'
import { StepFrame } from '@/components/common/metadata-lakehouse/StepFrame'
import { EmptyState, ErrorState, NoConnectionState } from '@/components/common/metadata-lakehouse/DataStates'
import { ConfidenceMeter } from '@/components/common/metadata-lakehouse/primitives'
import { formatRelativeTime } from '@/lib/format'
import { RelationshipJobError, useConnection, useRelationshipDetection } from '@/hooks/useMetadataLakehouse'
import { useWorkflow } from '@/context/workflowContext'
import type {
  DetectedRelationship,
  RelationshipDetection,
  RelationshipProgress,
} from '@/types/metadataLakehouse'
import { TableNode } from '@/components/common/metadata-lakehouse/steps/TableNode'
import { autoLayout, cardinalityEnds, columnHandle } from '@/lib/graphLayout'

const nodeTypes = { table: TableNode }

const CARDINALITY_LABELS: Record<string, string> = {
  many_to_one: 'Many to one',
  one_to_one: 'One to one',
  many_to_many: 'Many to many',
}

type Band = 'strong' | 'medium' | 'weak'

function bandOf(confidence: number): Band {
  if (confidence > 0.8) return 'strong'
  if (confidence >= 0.6) return 'medium'
  return 'weak'
}

const BAND_LABELS: Record<Band, string> = { strong: 'Strong', medium: 'Medium', weak: 'Weak' }

function cardinalityLabel(value: string): string {
  return CARDINALITY_LABELS[value] ?? value.replace(/_/g, ' ')
}

function joinCondition(r: DetectedRelationship): string {
  return r.from.columns
    .map((column, i) => `${r.from.table}.${column} = ${r.to.table}.${r.to.columns[i] ?? r.to.columns[0] ?? ''}`)
    .join(' AND ')
}

function detectionProblem(err: unknown): Error {
  if (err instanceof RelationshipJobError) return err
  if (err instanceof AdkApiError) {
    if (err.status === 429) return new Error('Relationship detection is busy right now. Wait a moment, then run it again.')
    if (err.status === 504) return new Error('The scan took longer than 10 minutes. Try again with fewer datasets.')
    if (err.status === 404)
      return new Error('The scan was lost before it finished: it expired or the service restarted. Run it again.')
    if (err.status === 422) return new Error(errorMessage(err, 'The selected datasets could not be compared.'))
  }
  return new Error(errorMessage(err, 'The relationship scan failed.'))
}

export function ModelStep() {
  const { connectionId, goToStep } = useWorkflow()
  const connection = useConnection(connectionId)
  const selected = useMemo(() => connection.data?.selectedDatasets ?? [], [connection.data])
  const datasetIds = useMemo(() => selected.map((d) => d.id), [selected])
  const names = useMemo(() => new Map(selected.map((d) => [d.id, d.name || d.id])), [selected])
  const detection = useRelationshipDetection(connectionId, datasetIds)

  if (!connectionId) {
    return (
      <StepFrame title="Model relationships" hideNext>
        <NoConnectionState onConnect={() => goToStep('connect')} />
      </StepFrame>
    )
  }

  const data = detection.data
  const activeCount = data?.relationships.filter((r) => r.active).length ?? 0
  const enough = datasetIds.length >= 2

  let body
  if (connection.isPending) {
    body = <ModelSkeleton />
  } else if (connection.isError) {
    body = (
      <ErrorState
        context="load the selected datasets"
        error={connection.error}
        onRetry={() => void connection.refetch()}
      />
    )
  } else if (!enough) {
    body = (
      <EmptyState
        title="Select at least two datasets"
        detail="Relationships are found between datasets. Choose two or more in the Discover step, then come back here."
        action={
          <Button variant="outline" size="sm" onClick={() => goToStep('discover')}>
            Go to Discover
          </Button>
        }
      />
    )
  } else if (!data && detection.isFetching) {
    body = <Scanning progress={detection.progress} total={datasetIds.length} />
  } else if (detection.isError) {
    body = (
      <ErrorState
        context="detect relationships"
        error={detectionProblem(detection.error)}
        onRetry={() => void detection.refetch()}
      />
    )
  } else if (data) {
    body = (
      <ReactFlowProvider>
        <ModelCanvas detection={data} names={names} />
      </ReactFlowProvider>
    )
  } else {
    body = <ModelSkeleton />
  }

  return (
    <StepFrame
      title="Model relationships"
      description="Relationships found by comparing the values in your selected datasets. They are suggestions and are not saved."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => void detection.refetch()}
          disabled={!enough || detection.isFetching}
        >
          <RefreshCw className={cn('size-4', detection.isFetching && 'animate-spin')} aria-hidden />
          Refresh
        </Button>
      }
      footerNote={
        data?.scannedAt
          ? `${data.tables.length} table${data.tables.length === 1 ? '' : 's'} · ${activeCount} relationship${
              activeCount === 1 ? '' : 's'
            } · scanned ${formatRelativeTime(data.scannedAt)}`
          : undefined
      }
      refreshing={Boolean(data) && detection.isFetching}
    >
      {body}
    </StepFrame>
  )
}

function Scanning({ progress, total }: { progress: RelationshipProgress | null; total: number }) {
  const detail =
    progress?.status === 'detecting'
      ? 'Comparing column values…'
      : progress && progress.total > 0
        ? `Sampled ${progress.sampled} of ${progress.total} datasets…`
        : `Reading ${total} datasets. This usually takes a few seconds.`
  return (
    <div className="relative" aria-busy="true">
      <ModelSkeleton />
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium">Scanning datasets…</p>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModelCanvas({ detection, names }: { detection: RelationshipDetection; names: Map<string, string> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAlternatives, setShowAlternatives] = useState(false)

  const alternatives = detection.relationships.filter((r) => !r.active).length
  const drawn = useMemo(
    () => detection.relationships.filter((r) => r.active || showAlternatives),
    [detection.relationships, showAlternatives]
  )

  const linkedByTable = useMemo(() => {
    const map = new Map<string, Set<string>>()
    const add = (id: string, columns: string[]) => {
      if (!map.has(id)) map.set(id, new Set())
      for (const c of columns) map.get(id)!.add(c)
    }
    for (const r of drawn) {
      add(r.from.datasetId, r.from.columns)
      add(r.to.datasetId, r.to.columns)
    }
    return map
  }, [drawn])

  const initialNodes = useMemo<Node[]>(() => {
    const layoutEdges = drawn.map((r) => ({ source: r.from.datasetId, target: r.to.datasetId }))
    const positions = new Map(autoLayout(detection.tables, layoutEdges).map((p) => [p.id, p.position]))
    return detection.tables.map((table) => ({
      id: table.id,
      type: 'table',
      position: positions.get(table.id) ?? { x: 0, y: 0 },
      data: {
        table,
        highlighted: false,
        linked: [...(linkedByTable.get(table.id) ?? [])].filter((c) => table.columns.some((col) => col.name === c)),
        activeColumns: [],
      },
    }))
  }, [detection.tables, drawn, linkedByTable])

  const initialEdges = useMemo<Edge[]>(() => {
    const hasColumn = (tableId: string, column: string | undefined) =>
      Boolean(column) &&
      (detection.tables.find((t) => t.id === tableId)?.columns.some((c) => c.name === column) ?? false)
    return drawn.map((r) => {
      const [fromEnd, toEnd] = cardinalityEnds(r.cardinality.replace(/_/g, '-'))
      const fromColumn = r.from.columns[0]
      const toColumn = r.to.columns[0]
      return {
        id: r.id,
        source: r.from.datasetId,
        target: r.to.datasetId,
        sourceHandle: hasColumn(r.from.datasetId, fromColumn) ? columnHandle(fromColumn, 'source') : 'table:source',
        targetHandle: hasColumn(r.to.datasetId, toColumn) ? columnHandle(toColumn, 'target') : 'table:target',
        type: 'smoothstep',
        label: `${fromEnd || '?'} ─ ${toEnd || '?'} · ${BAND_LABELS[bandOf(r.confidence)]}`,
        style: {
          strokeWidth: r.active ? 1.75 : 1.25,
          strokeDasharray: r.active ? undefined : '5 3',
          opacity: r.active ? 1 : 0.6,
        },
        labelStyle: { fontSize: 11, fontWeight: 600 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        data: { relationship: r },
      }
    })
  }, [drawn, detection.tables])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes])
  useEffect(() => setEdges(initialEdges), [initialEdges, setEdges])

  const selected = useMemo(() => drawn.find((r) => r.id === selectedId) ?? null, [drawn, selectedId])

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        data: {
          ...(node.data as Record<string, unknown>),
          highlighted: Boolean(selected) && (node.id === selected!.from.datasetId || node.id === selected!.to.datasetId),
          activeColumns: !selected
            ? []
            : node.id === selected.from.datasetId
              ? selected.from.columns
              : node.id === selected.to.datasetId
                ? selected.to.columns
                : [],
        },
      })) as Node[]
    )
  }, [selected, setNodes])

  const onEdgeClick = useCallback((_: unknown, edge: Edge) => setSelectedId(edge.id), [])

  const nameOf = (id: string) => detection.tables.find((t) => t.id === id)?.name ?? names.get(id) ?? id
  const partial = detection.relationships.filter((r) => r.active && r.partialScan).length
  const sampled = detection.relationships.filter((r) => r.active && r.manySideSampled).length
  const sensitive = detection.relationships.filter((r) => r.active && r.involvesSensitiveColumn).length

  const notices = [
    ...detection.datasetsSkipped.map((d) => `${nameOf(d.datasetId)} could not be scanned: ${d.reason}.`),
    ...(partial
      ? [
          `${partial} relationship${partial === 1 ? ' was' : 's were'} found from part of the rows only, so ${
            partial === 1 ? 'its' : 'their'
          } confidence is capped at 70%.`,
        ]
      : []),
    ...(sampled
      ? [`${sampled} relationship${sampled === 1 ? ' is' : 's are'} based on a sample of the "many" side.`]
      : []),
    ...(sensitive
      ? [
          `${sensitive} relationship${sensitive === 1 ? ' uses' : 's use'} a column whose name looks sensitive. No values are shown.`,
        ]
      : []),
    ...detection.warnings,
  ]

  if (detection.tables.length === 0) {
    return (
      <EmptyState
        title="No datasets could be scanned"
        detail={notices.length ? notices.join(' ') : 'Run the scan again in a moment.'}
      />
    )
  }

  return (
    <div className="space-y-3">
      {notices.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {notices.map((notice, i) => (
            <li key={i} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>{notice}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {detection.relationships.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          No relationships were found between these {detection.tables.length} datasets. Their column values do not
          overlap enough to suggest a join.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="h-[560px] overflow-hidden rounded-lg border bg-muted/20">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeClick={onEdgeClick}
            onPaneClick={() => setSelectedId(null)}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            minZoom={0.1}
            maxZoom={1.75}
            proOptions={{ hideAttribution: false }}
          >
            <Background gap={16} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable className="!bg-background" />
          </ReactFlow>
        </div>

        <aside className="min-w-0">
          {selected ? (
            <RelationshipDetail relationship={selected} onClose={() => setSelectedId(null)} />
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Relationship details</p>
              <p className="mt-1">
                Select a relationship on the canvas to see its join columns, confidence and why it was suggested.
              </p>
              <ul className="mt-3 space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <span className="w-8 border-t-2 border-foreground/70" aria-hidden /> Suggested relationship
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-8 border-t-2 border-dashed border-foreground/50" aria-hidden /> Alternative
                </li>
                <li className="pt-1">Arrows point from the "many" side to the "one" side.</li>
                <li>Strong above 80% · Medium 60–80% · Weak below 60%</li>
              </ul>
              <dl className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt>Tables</dt>
                  <dd className="tabular-nums text-foreground">{detection.tables.length}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Relationships</dt>
                  <dd className="tabular-nums text-foreground">{detection.relationships.length - alternatives}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Alternatives</dt>
                  <dd className="tabular-nums text-foreground">{alternatives}</dd>
                </div>
              </dl>
              {alternatives > 0 ? (
                <label className="mt-3 flex items-center justify-between gap-2 text-xs text-foreground">
                  Show alternatives
                  <Switch checked={showAlternatives} onCheckedChange={setShowAlternatives} />
                </label>
              ) : null}
              {detection.unrelatedTables.length > 0 ? (
                <div className="mt-4 text-xs">
                  <p className="font-medium text-foreground">Not connected</p>
                  <ul className="mt-1 space-y-1">
                    {detection.unrelatedTables.map((id) => (
                      <li key={id} className="flex items-center gap-1.5">
                        <Database className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">{nameOf(id)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function RelationshipDetail({
  relationship: r,
  onClose,
}: {
  relationship: DetectedRelationship
  onClose: () => void
}) {
  const band = bandOf(r.confidence)
  return (
    <div className="rounded-lg border bg-card">
      <header className="flex items-center gap-2 border-b px-3.5 py-2.5">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">Relationship details</p>
        <Button variant="ghost" size="icon" className="size-6" onClick={onClose}>
          <X className="size-3.5" aria-hidden />
          <span className="sr-only">Close</span>
        </Button>
      </header>

      <div className="space-y-3 px-3.5 py-3 text-sm">
        <p className="font-mono text-xs break-all">
          {r.from.table} <span className="text-muted-foreground">→</span> {r.to.table}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 font-medium',
              r.active ? 'border-primary/30 bg-primary/10 text-primary' : 'text-muted-foreground'
            )}
          >
            {r.active ? 'Suggested' : 'Alternative'}
          </span>
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 font-medium',
              band === 'strong' && 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
              band === 'medium' && 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
              band === 'weak' && 'text-muted-foreground'
            )}
          >
            {BAND_LABELS[band]}
          </span>
        </div>

        <dl className="space-y-2">
          <div>
            <dt className="text-xs text-muted-foreground">Type</dt>
            <dd>{cardinalityLabel(r.cardinality)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{r.composite ? 'Join columns (used together)' : 'Join'}</dt>
            <dd>
              <code className="mt-0.5 block overflow-x-auto rounded bg-muted px-2 py-1 font-mono text-xs">
                {joinCondition(r)}
              </code>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Confidence</dt>
            <dd className="mt-1">
              <ConfidenceMeter value={r.confidence} />
            </dd>
          </div>
        </dl>

        {r.partialScan || r.manySideSampled || r.involvesSensitiveColumn ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {r.partialScan ? <li>Found from part of the rows only. Confidence is capped at 70%.</li> : null}
            {r.manySideSampled ? <li>The "many" side is based on a sample.</li> : null}
            {r.involvesSensitiveColumn ? <li>A column name looks sensitive. No values are shown.</li> : null}
          </ul>
        ) : null}

        {r.basis ? (
          <div className="rounded-md border-l-2 border-l-violet-400 bg-violet-50/50 px-3 py-2 dark:bg-violet-950/20">
            <p className="text-xs font-medium text-violet-700 dark:text-violet-300">Why this was suggested</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.basis}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ModelSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]" aria-busy="true">
      <span className="sr-only">Loading the data model…</span>
      <div className="relative h-[520px] overflow-hidden rounded-xl border bg-card">
        <Skeleton className="absolute left-[10%] top-[18%] h-28 w-48 rounded-lg" />
        <Skeleton className="absolute right-[12%] top-[30%] h-32 w-52 rounded-lg" />
        <Skeleton className="absolute bottom-[14%] left-[32%] h-28 w-48 rounded-lg" />
      </div>
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  )
}
