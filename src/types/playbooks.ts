export type DomainKey = 'invoice' | 'sales' | 'procurement' | 'inventory'
export type DomainTone = 'blue' | 'teal' | 'orange' | 'green'
export type PlaybookStatus = 'active' | 'paused'
export type RunStatus = 'healthy' | 'attention'
export type Level = 'high' | 'medium' | 'low'
export type ChannelKey = 'email' | 'teams' | 'slack' | 'inapp'
export type PersonType = 'role' | 'team' | 'individual' | 'group'
export type TraceStatus = 'exploring' | 'investigating' | 'validating' | 'cross-checking' | 'resolved'

export interface PlaybookKpi {
  name: string
  description: string
  tables: string[]
  confidence: number
  freshness: string
  enabled: boolean
  trend: number[]
}

export interface DomainProfile {
  label: string
  tone: DomainTone
  purpose: string
  dataSources: string[]
  tables: string[]
  kpis: PlaybookKpi[]
}

export interface KpiUnit {
  prefix: string
  suffix: string
  decimals: number
}

export interface Finding {
  title: string
  description: string
  confidence: number
  impact: Level
  metric: string
  evidence?: string[]
  impactNote?: string
  suggestedAction?: string
  recipients?: string[]
}

export interface Recommendation {
  text: string
  reason?: string
  impactNote?: string
  impact: Level
  priority: Level
}

export interface InsightProfile {
  kpiLabel: string
  dimensionLabel: string
  dimensions: string[]
  baseline: number
  anomalyValue: number
  trendGood: 'up' | 'down'
  unit: KpiUnit
  declineHeadline: string
  driverPrimary: string
  driverSecondary: string
  findings: Finding[]
  recommendations: Recommendation[]
  factorSkew: number[]
}

export interface PlaybookVersion {
  version: string
  date: string
  note: string
  author: string
  snapshot?: string
}

export interface RunRecord {
  status: RunStatus
  when: string
  duration: string
  stepsCompleted: number
}

export interface PlaybookSeed {
  id: string
  domain: DomainKey
  name: string
  owner: string
  version: string
  aiConfidence: number
  health: number
  frequency: string
  channels: string[]
  status: PlaybookStatus
  createdDate: string
  modifiedDate: string
  lastRun: string
  nextRun: string
  history: RunRecord[]
  versions: PlaybookVersion[]
}

export interface AssistantMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
}

export interface Playbook extends PlaybookSeed {
  domainLabel: string
  tone: DomainTone
  purpose: string
  dataSources: string[]
  tables: string[]
  kpis: PlaybookKpi[]
  alertThresholdPct: number | null
  yaml: string
  savedYaml: string
  chat: AssistantMessage[]
}

export interface PlaybookDraft {
  kpis: PlaybookKpi[]
  frequency: string
  alertThresholdPct: number | null
}

export interface ActivityItem {
  id: string
  time: string
  text: string
  tone: 'success' | 'neutral'
}

export interface Execution {
  id: string
  when: string
  status: RunStatus
  duration: string
  recordsProcessed: number
  kpisEvaluated: number
  alertsGenerated: number
  healthScore: number
  kpiValue: number
  queriesExecuted: number
  agentVersion: string
  actioned: number[]
  activity: ActivityItem[]
  clock: number
}

export interface Person {
  type: PersonType
  name: string
  sub: string
}

export interface ActionRequest {
  channels: ChannelKey[]
  recipients: string[]
  subject: string
  message: string
  snapshot: boolean
}

export interface TraceBranch {
  label: string
  state: 'strong' | 'weak' | ''
}

export interface TraceStep {
  status: TraceStatus
  text: string
  detail?: string
  tools?: string[]
  branches?: TraceBranch[]
  backtrack?: boolean
  time?: string
}
