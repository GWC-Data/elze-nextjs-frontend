import { DOMAIN_PROFILES, INSIGHT_PROFILES } from '@/constants/playbookSamples'
import { generateYaml } from '@/lib/playbookYaml'
import type {
  ChannelKey,
  DomainKey,
  Execution,
  Finding,
  InsightProfile,
  Playbook,
  PlaybookSeed,
  Recommendation,
  TraceStep,
} from '@/types/playbooks'

const WHENS = ['Today, 6:00 AM', 'Yesterday, 6:00 AM', '2 days ago, 6:00 AM', '3 days ago, 6:00 AM', '4 days ago, 6:00 AM']
const JITTER = [0, -0.012, 0.009, -0.006, 0.014]
const START_CLOCK = 7 * 60 + 42
const AGENT_VERSION = 'Agent v3.2.1'

const ALERT_NOUN: Record<DomainKey, string> = {
  invoice: 'Invoice',
  sales: 'Sales',
  procurement: 'Vendor',
  inventory: 'Inventory',
}

export const ACTION_CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'teams', label: 'Microsoft Teams' },
  { key: 'slack', label: 'Slack' },
  { key: 'inapp', label: 'In-App' },
]

export const STABLE_RECOMMENDATIONS: Recommendation[] = [
  { text: 'No corrective action needed — continue monitoring on the current schedule.', impact: 'low', priority: 'low' },
]

function hash(text: string): number {
  let value = 2166136261
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

export function seededRandom(seed: string): () => number {
  let state = hash(seed) || 1
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function lowerFirst(text: string): string {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text
}

export function insightProfile(playbook: Pick<Playbook, 'domain'>): InsightProfile {
  return INSIGHT_PROFILES[playbook.domain]
}

export function formatKpi(profile: InsightProfile, value: number): string {
  const { prefix, suffix, decimals } = profile.unit
  return `${prefix}${value.toFixed(decimals)}${suffix}`
}

export function deltaPct(profile: InsightProfile): number {
  return Math.round(Math.abs((profile.anomalyValue - profile.baseline) / profile.baseline) * 1000) / 10
}

export function kpiChange(profile: InsightProfile, value: number): { pct: number; good: boolean } {
  const pct = ((value - profile.baseline) / profile.baseline) * 100
  return { pct, good: profile.trendGood === 'up' ? pct >= 0 : pct <= 0 }
}

export function clockLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const h12 = ((h24 + 11) % 12) + 1
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

export function nextClock(clock: number): number {
  return clock + 1 + Math.round(Math.random() * 14)
}

export function currentTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function confidenceWord(confidence: number): string {
  return confidence >= 90 ? 'High' : confidence >= 75 ? 'Moderate' : 'Preliminary'
}

export function createPlaybook(seed: PlaybookSeed): Playbook {
  const profile = DOMAIN_PROFILES[seed.domain]
  const base = {
    ...seed,
    domainLabel: profile.label,
    tone: profile.tone,
    purpose: profile.purpose,
    dataSources: [...profile.dataSources],
    tables: [...profile.tables],
    kpis: profile.kpis.map((kpi) => ({ ...kpi, tables: [...kpi.tables], trend: [...kpi.trend] })),
    alertThresholdPct: null,
    chat: [],
  }
  const yaml = generateYaml(base)
  return { ...base, yaml, savedYaml: yaml }
}

export function buildExecutions(playbook: Playbook): Execution[] {
  const profile = insightProfile(playbook)
  const random = seededRandom(playbook.id)
  const number = Number(/\d+/.exec(playbook.id)?.[0] ?? 0)
  return WHENS.map((when, index): Execution => {
    const anomaly = index === 0
    const id = `EXE-${84000 + index * 211 + number * 17}`
    return {
      id,
      when,
      status: anomaly ? 'attention' : 'healthy',
      duration: `${(6 + random() * 3).toFixed(1)}s`,
      recordsProcessed: Math.round(9000 + random() * 4200),
      kpisEvaluated: playbook.kpis.length,
      alertsGenerated: anomaly ? 3 : 0,
      healthScore: anomaly ? 76 : Math.round(90 + random() * 8),
      kpiValue: anomaly ? profile.anomalyValue : Math.round(profile.baseline * (1 + JITTER[index]) * 100) / 100,
      queriesExecuted: Math.round(playbook.kpis.length * 2 + 3 + random() * 4),
      agentVersion: AGENT_VERSION,
      actioned: [],
      activity: anomaly
        ? [{ id: `${id}-0`, time: clockLabel(START_CLOCK), text: `AI identified ${lowerFirst(profile.declineHeadline)}.`, tone: 'neutral' }]
        : [],
      clock: START_CLOCK,
    }
  })
}

export function freshExecution(playbook: Playbook, sequence: number): Execution {
  const profile = insightProfile(playbook)
  const random = seededRandom(`${playbook.id}-${sequence}`)
  return {
    id: `EXE-${90000 + sequence}`,
    when: 'Just now',
    status: 'healthy',
    duration: `${(6 + random() * 3).toFixed(1)}s`,
    recordsProcessed: Math.round(9000 + random() * 4200),
    kpisEvaluated: playbook.kpis.length,
    alertsGenerated: 0,
    healthScore: Math.round(92 + random() * 6),
    kpiValue: profile.baseline,
    queriesExecuted: Math.round(playbook.kpis.length * 2 + 3 + random() * 4),
    agentVersion: AGENT_VERSION,
    actioned: [],
    activity: [],
    clock: START_CLOCK,
  }
}

export function stableFindings(profile: InsightProfile): Finding[] {
  return [
    {
      title: 'No material anomalies detected',
      description: `${profile.kpiLabel} stayed within its expected range across all monitored ${profile.dimensionLabel.toLowerCase()}s.`,
      confidence: 96,
      impact: 'low',
      metric: 'Within expected range',
    },
    {
      title: 'Data freshness nominal',
      description: 'All source tables refreshed on schedule with no missing partitions.',
      confidence: 98,
      impact: 'low',
      metric: '100% on-time refresh',
    },
  ]
}

export function runFindings(profile: InsightProfile, execution: Execution): Finding[] {
  return execution.status === 'attention' ? profile.findings : stableFindings(profile)
}

export function runRecommendations(profile: InsightProfile, execution: Execution): Recommendation[] {
  return execution.status === 'attention' ? profile.recommendations : STABLE_RECOMMENDATIONS
}

export function findingEvidence(profile: InsightProfile, finding: Finding): string[] {
  return finding.evidence ?? [finding.metric, `Cross-checked against ${profile.dimensionLabel.toLowerCase()}-level source data.`]
}

export function suggestedAction(profile: InsightProfile, finding: Finding): string {
  return (
    finding.suggestedAction ??
    `Notify the team responsible for ${profile.dimensionLabel.toLowerCase()} performance and share this finding for review.`
  )
}

export function executiveSummary(profile: InsightProfile, execution: Execution): string {
  if (execution.status === 'attention') {
    return `${profile.declineHeadline} by **${deltaPct(profile)}%** compared with the previous comparable period. The primary contributors are **${profile.driverPrimary}** and **${profile.driverSecondary}**.`
  }
  return `No material anomalies were detected in this run. ${profile.kpiLabel} stayed within its expected range across all monitored ${profile.dimensionLabel.toLowerCase()}s, and no follow-up action is required.`
}

export function technicalDetails(playbook: Playbook, execution: Execution): [string, string][] {
  return [
    ['Execution ID', execution.id],
    ['Started at', execution.when],
    ['Completed at', `${execution.when} (+${execution.duration})`],
    ['Duration', execution.duration],
    ['MCP source', playbook.dataSources[0] ?? '—'],
    ['Queries executed', String(execution.queriesExecuted)],
    ['Tables accessed', String(playbook.tables.length)],
    ['Records analyzed', execution.recordsProcessed.toLocaleString('en-US')],
    ['Agent version', execution.agentVersion],
    ['Playbook version', playbook.version],
    ['Execution status', execution.status === 'attention' ? 'Needs attention' : 'Healthy'],
  ]
}

export function runSteps(playbook: Playbook): TraceStep[] {
  const source = playbook.dataSources[0] ?? 'Source'
  return [
    { status: 'exploring', text: 'Loading enterprise knowledge for this playbook…', detail: `Pulling schema intelligence, relationships and business glossary for ${playbook.domainLabel}.` },
    { status: 'investigating', text: 'Connecting to MCP…', detail: `Authenticating against ${source} and validating session health.`, tools: [`${source} MCP — session authenticated`] },
    { status: 'investigating', text: 'Reading metadata for connected tables…', detail: `Refreshing column definitions for ${playbook.tables.join(', ')}.`, tools: [`${playbook.tables.length} tables — metadata refreshed`] },
    { status: 'investigating', text: 'Executing KPI queries…', detail: `Running ${playbook.kpis.length} metric queries against the connected tables.` },
    { status: 'validating', text: 'Running business rules…', detail: 'Applying validation and business-rule checks defined in this playbook.' },
    { status: 'cross-checking', text: 'Computing metrics & confidence scores…', detail: 'Aggregating results and cross-checking against the previous run for this playbook.' },
    { status: 'investigating', text: 'Generating insights…', detail: 'Drafting the narrative summary and anomaly flags for this run.' },
    { status: 'resolved', text: 'Execution completed.', detail: 'All steps finished successfully with no critical anomalies.' },
  ]
}

export function agentTrace(playbook: Playbook, execution: Execution, profile: InsightProfile): TraceStep[] {
  const source = playbook.dataSources[0] ?? 'Source'
  const dimension = profile.dimensionLabel.toLowerCase()
  const findings = runFindings(profile, execution).length
  const recommendations = runRecommendations(profile, execution).length
  const time = execution.when
  return [
    { status: 'investigating', text: 'Connected to MCP', detail: `Authenticated against ${source} and validated session health.`, tools: [`${source} MCP — session authenticated`], time },
    { status: 'investigating', text: 'Loaded playbook definition', detail: `Loaded ${playbook.name} ${playbook.version} and parsed its schedule, metrics and business rules.`, time },
    { status: 'investigating', text: 'Resolved required schema', detail: `Resolved table and column references across ${playbook.tables.join(', ')}.`, time },
    { status: 'investigating', text: 'Retrieved source data', detail: `Pulled ${execution.recordsProcessed.toLocaleString('en-US')} records from the connected source tables.`, time },
    { status: 'investigating', text: `Calculated ${profile.kpiLabel}`, detail: `Computed the current period value: ${formatKpi(profile, execution.kpiValue)}.`, time },
    { status: 'cross-checking', text: 'Performed variance analysis', detail: `Compared against the trailing baseline of ${formatKpi(profile, profile.baseline)}.`, time },
    { status: 'exploring', text: `Explored contributing ${dimension}s`, detail: `Ranked ${dimension}s by contribution to the change.`, time },
    { status: 'validating', text: 'Generated findings with supporting evidence', detail: `${findings} finding${findings === 1 ? '' : 's'} generated and cross-checked against source data.`, time },
    { status: 'investigating', text: 'Generated recommendations', detail: `${recommendations} recommended action${recommendations === 1 ? '' : 's'} produced from the findings.`, time },
    { status: 'resolved', text: 'Completed', detail: `Execution finished with status: ${execution.status === 'attention' ? 'Needs attention' : 'Healthy'}.`, time },
  ]
}

export function investigationTitle(profile: InsightProfile, anomaly: boolean): string {
  return anomaly ? `Why did ${profile.kpiLabel.toLowerCase()} move?` : 'Checking for anomalies'
}

export function investigationSteps(profile: InsightProfile, anomaly: boolean): TraceStep[] {
  const dimension = profile.dimensionLabel.toLowerCase()
  const kpi = profile.kpiLabel.toLowerCase()
  if (!anomaly) {
    return [
      { status: 'exploring', text: `Checking ${dimension}-level variance for ${kpi}.`, branches: profile.dimensions.map((label) => ({ label, state: '' })) },
      { status: 'validating', text: `All monitored ${dimension}s stayed within their expected range.` },
      { status: 'resolved', text: 'No material anomalies found — no follow-up action required.' },
    ]
  }
  const findings = profile.findings
  const confirmed = findings[1] ?? findings[0]
  const dead = findings[findings.length - 1]
  const last = profile.dimensions.length - 1
  const steps: TraceStep[] = [
    { status: 'exploring', text: `Investigating ${kpi}. Starting with ${dimension}-level variance.` },
    {
      status: 'investigating',
      text: `${profile.declineHeadline} by **${deltaPct(profile)}%**. Exploring possible contributors.`,
      branches: profile.dimensions.map((label, i) => ({ label, state: i === 0 ? 'strong' : i === last ? 'weak' : '' })),
    },
    {
      status: 'investigating',
      text: `**${profile.dimensions[0]}** stands out — contributing roughly ${profile.factorSkew[0] ?? '—'}% of the movement.`,
      detail: findings[0]?.description,
    },
  ]
  if (dead && dead !== confirmed) {
    steps.push({
      status: 'cross-checking',
      text: `Checking whether “${dead.title}” explains the remainder…`,
      detail: `Confidence ${dead.confidence}%. Limited overlap with the affected window.`,
      backtrack: true,
      branches: [{ label: dead.title, state: 'weak' }],
    })
  }
  steps.push(
    {
      status: 'validating',
      text: `Returning to the primary path — investigating ${confirmed ? confirmed.title.toLowerCase() : 'the next candidate'}.`,
      detail: confirmed?.description,
      tools: ['Enterprise Semantic Layer — related entities checked'],
    },
    {
      status: 'cross-checking',
      text: `Correlating this finding against the overall ${kpi} impact…`,
      detail: confirmed?.impactNote ?? 'Cross-checked against the current-period variance.',
    },
    { status: 'resolved', text: `${profile.driverPrimary} and ${profile.driverSecondary} explain most of the movement.` }
  )
  return steps
}

export function investigationOutcome(profile: InsightProfile, anomaly: boolean): string {
  if (!anomaly) return 'Investigation complete. No anomalies detected this run.'
  return `Investigation complete. ${lowerFirst(profile.declineHeadline)} by ${deltaPct(profile)}%. ${profile.driverPrimary} and ${profile.driverSecondary} explain most of the movement.`
}

export function actionSubject(playbook: Playbook, finding: Finding): string {
  return `${ALERT_NOUN[playbook.domain]} Alert — ${finding.title}`
}

export function actionMessage(playbook: Playbook, execution: Execution, profile: InsightProfile, finding: Finding): string {
  const evidence = finding.evidence ?? [finding.metric]
  return [
    finding.description,
    '',
    `This was detected during the ${execution.when} monitoring cycle for ${playbook.name}.`,
    '',
    'Supporting evidence:',
    ...evidence.map((item) => `• ${item}`),
    '',
    'Recommended next step:',
    suggestedAction(profile, finding),
  ].join('\n')
}
