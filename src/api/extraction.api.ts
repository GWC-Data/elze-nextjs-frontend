import {
  ExtractionConnectionLostError,
  createContextLayerSession,
  getAdkContextObjects,
  getAdkSession,
  interruptAdkSession,
  triggerContextLayer,
  uploadAdkArtifact,
} from '@/api/adk.api'
import { errorMessage } from '@/api/client'
import type { AdkInterruptResult } from '@/types/adk'

const AGENT = 'context_layer_extractor' as const

export class ExtractionStoppedError extends Error {
  constructor() {
    super('The context extraction was interrupted before it finished.')
    this.name = 'ExtractionStoppedError'
  }
}

export interface ExtractionResult {
  sessionId: string
  text: string
  toolCalls: string[]
  interrupted: boolean
  datasetIds?: string[] | null
  extractedAt?: string | null
  unconfirmed?: boolean
  savedFacts?: number
  businessContext?: BusinessContextOutcome
}

export type BusinessContextOutcome =
  | { status: 'applied' }
  | { status: 'stopped' }
  | { status: 'failed'; error: string }

const CLOCK_MARGIN_MS = 5000

async function factsSavedSince(contextId: string, versionId: string, sinceMs: number): Promise<number> {
  const saved = await getAdkContextObjects(contextId, versionId).catch(() => null)
  if (!saved) return 0
  return saved.objects.filter((o) => {
    const written = Date.parse(o.updatedAt || o.createdAt)
    return Number.isFinite(written) && written >= sinceMs - CLOCK_MARGIN_MS
  }).length
}

export interface ExtractionTarget {
  versionId: string
  contextName: string
  contextDescription?: string | null
  datasetIds: string[]
  files?: File[]
  businessContext?: string
}

export function withBusinessContextReply(report: string, reply: string): string {
  const added = reply.trim()
  if (!added) return report
  return [report.trim(), `## Business context\n\n${added}`].filter(Boolean).join('\n\n')
}

export async function applyBusinessContext(contextId: string, sessionId: string, request: string): Promise<string> {
  const { success } = await triggerContextLayer(contextId, sessionId, { text: request })
  if (!success) throw new ExtractionStoppedError()
  const reply = await fetchExtractionSession(contextId, sessionId).catch(() => null)
  return reply?.text ?? ''
}

async function businessContextAfter(
  contextId: string,
  sessionId: string,
  request: string
): Promise<{ reply: string; outcome: BusinessContextOutcome }> {
  try {
    return { reply: await applyBusinessContext(contextId, sessionId, request), outcome: { status: 'applied' } }
  } catch (err) {
    if (err instanceof ExtractionStoppedError) return { reply: '', outcome: { status: 'stopped' } }
    return {
      reply: '',
      outcome: { status: 'failed', error: errorMessage(err, 'The agent service did not respond.') },
    }
  }
}

async function uploadFiles(contextId: string, sessionId: string, files: File[]): Promise<string[]> {
  const ids: string[] = []
  for (const file of files) {
    try {
      const artifact = await uploadAdkArtifact(contextId, AGENT, sessionId, file)
      ids.push(artifact.id)
    } catch (err) {
      throw new Error(`${file.name} could not be uploaded: ${errorMessage(err, 'the upload failed.')}`, {
        cause: err,
      })
    }
  }
  return ids
}

export async function runExtraction(
  contextId: string,
  target: ExtractionTarget,
  onSession?: (sessionId: string) => void
): Promise<ExtractionResult> {
  const session = await createContextLayerSession(contextId, {
    versionId: target.versionId,
    contextName: target.contextName,
    contextDescription: target.contextDescription,
    datasetIds: target.datasetIds,
  })
  onSession?.(session.sessionId)
  const startedMs = session.lastUpdateTime ? session.lastUpdateTime * 1000 : Date.now()
  const artifactIds = await uploadFiles(contextId, session.sessionId, target.files ?? [])

  let savedFacts: number | undefined
  try {
    const { success } = await triggerContextLayer(contextId, session.sessionId, { artifactIds })
    if (!success) throw new ExtractionStoppedError()
  } catch (err) {
    if (!(err instanceof ExtractionConnectionLostError)) throw err
    savedFacts = await factsSavedSince(contextId, target.versionId, startedMs)
    if (!savedFacts) {
      throw new Error(
        'The connection to the agent service closed before the extraction finished, and no facts were saved. Run the analysis again.',
        { cause: err }
      )
    }
  }

  const report = await fetchExtractionSession(contextId, session.sessionId).catch(() => null)
  const followUp =
    target.businessContext && !savedFacts
      ? await businessContextAfter(contextId, session.sessionId, target.businessContext)
      : null

  return {
    sessionId: session.sessionId,
    text: withBusinessContextReply(report?.text ?? '', followUp?.reply ?? ''),
    toolCalls: [],
    interrupted: false,
    datasetIds: target.datasetIds,
    ...(savedFacts ? { unconfirmed: true, savedFacts } : {}),
    ...(followUp ? { businessContext: followUp.outcome } : {}),
  }
}

export function stopExtraction(contextId: string, sessionId: string): Promise<AdkInterruptResult> {
  return interruptAdkSession(contextId, AGENT, sessionId)
}

export async function fetchExtractionSession(
  contextId: string,
  sessionId: string
): Promise<ExtractionResult | null> {
  const detail = await getAdkSession(contextId, AGENT, sessionId)
  const answer = [...detail.turns].reverse().find((turn) => turn.role !== 'user')
  if (!answer || !answer.text.trim()) return null

  return {
    sessionId,
    text: answer.text,
    toolCalls: [],
    interrupted: false,
  }
}
