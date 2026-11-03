import { adkRequest } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type {
  DetectedRelationship,
  DetectedTable,
  RelationshipDetection,
  RelationshipJobStatus,
  RelationshipProgress,
} from '@/types/metadataLakehouse'

const MIN_CONFIDENCE = 0.5

interface RawEnd {
  dataset_id: string
  table: string
  columns?: string[]
}

interface RawRelationship {
  id: string
  from: RawEnd
  to: RawEnd
  cardinality: string
  composite?: boolean
  confidence: number
  active?: boolean
  involves_sensitive_column?: boolean
  evidence?: { partial_scan?: boolean; many_side_sampled?: boolean } | null
  basis?: string | null
}

interface RawTable {
  dataset_id: string
  name: string
  row_count?: number | null
  columns?: { name: string; type?: string | null; key_candidate?: boolean; sensitive_name?: boolean }[]
}

interface RawDetection {
  tables?: RawTable[]
  relationships?: RawRelationship[]
  unrelated_tables?: string[]
  warnings?: string[]
  datasets_skipped?: { dataset_id: string; reason: string }[]
  scanned_at?: string | null
}

interface RawJobStarted {
  job_id: string
}

interface RawJob {
  status: RelationshipJobStatus
  progress?: { sampled?: number; total?: number } | null
  result: RawDetection | null
  error: string | null
}

export type DetectionStart = { kind: 'result'; result: RelationshipDetection } | { kind: 'job'; jobId: string }

export interface RelationshipJob {
  status: RelationshipJobStatus
  progress: RelationshipProgress
  result: RelationshipDetection | null
  error: string | null
}

function toTable(raw: RawTable): DetectedTable {
  return {
    id: raw.dataset_id,
    name: raw.name || raw.dataset_id,
    rowCount: raw.row_count ?? null,
    columns: (raw.columns ?? []).map((c) => ({
      name: c.name,
      dataType: c.type ?? null,
      keyCandidate: Boolean(c.key_candidate),
      sensitive: Boolean(c.sensitive_name),
    })),
  }
}

function toRelationship(raw: RawRelationship): DetectedRelationship {
  const end = (e: RawEnd) => ({ datasetId: e.dataset_id, table: e.table, columns: e.columns ?? [] })
  return {
    id: raw.id,
    from: end(raw.from),
    to: end(raw.to),
    cardinality: raw.cardinality,
    composite: Boolean(raw.composite),
    confidence: raw.confidence,
    active: Boolean(raw.active),
    involvesSensitiveColumn: Boolean(raw.involves_sensitive_column),
    partialScan: Boolean(raw.evidence?.partial_scan),
    manySideSampled: Boolean(raw.evidence?.many_side_sampled),
    basis: raw.basis ?? '',
  }
}

function toDetection(raw: RawDetection): RelationshipDetection {
  return {
    tables: (raw.tables ?? []).map(toTable),
    relationships: (raw.relationships ?? []).map(toRelationship),
    unrelatedTables: raw.unrelated_tables ?? [],
    warnings: raw.warnings ?? [],
    datasetsSkipped: (raw.datasets_skipped ?? []).map((d) => ({ datasetId: d.dataset_id, reason: d.reason })),
    scannedAt: raw.scanned_at ?? null,
  }
}

export async function startRelationshipDetection(contextId: string, datasetIds: string[]): Promise<DetectionStart> {
  const raw = await adkRequest<RawDetection | RawJobStarted>(endpoints.adk.relationshipsDetect(contextId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_ids: datasetIds, min_confidence: MIN_CONFIDENCE, verify_keys: false, use_llm: false }),
  })
  return 'job_id' in raw ? { kind: 'job', jobId: raw.job_id } : { kind: 'result', result: toDetection(raw) }
}

export async function fetchRelationshipJob(contextId: string, jobId: string): Promise<RelationshipJob> {
  const raw = await adkRequest<RawJob>(endpoints.adk.relationshipJob(contextId, jobId))
  return {
    status: raw.status,
    progress: { status: raw.status, sampled: raw.progress?.sampled ?? 0, total: raw.progress?.total ?? 0 },
    result: raw.result ? toDetection(raw.result) : null,
    error: raw.error,
  }
}
