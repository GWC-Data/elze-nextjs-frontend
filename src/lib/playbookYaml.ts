import { slugifyFilename, triggerDownload } from '@/lib/exportTable'
import type { Playbook } from '@/types/playbooks'

type YamlSource = Pick<
  Playbook,
  | 'name'
  | 'purpose'
  | 'version'
  | 'status'
  | 'owner'
  | 'domainLabel'
  | 'dataSources'
  | 'tables'
  | 'kpis'
  | 'channels'
  | 'frequency'
  | 'alertThresholdPct'
  | 'modifiedDate'
  | 'createdDate'
  | 'history'
  | 'lastRun'
  | 'nextRun'
>

export type YamlTokenKind = 'plain' | 'dash' | 'key' | 'mark' | 'string' | 'number' | 'comment'

export interface YamlToken {
  kind: YamlTokenKind
  text: string
}

export interface DiffRow {
  type: 'context' | 'add' | 'remove'
  text: string
}

const quote = (value: string) => `"${value.replace(/"/g, '\\"')}"`
const list = (items: string[]) => `[${items.map(quote).join(', ')}]`
const keyOf = (table: string) => `${table.replace(/"/g, '\\"').replace(/\s+/g, '_')}_ID`

export function generateYaml(playbook: YamlSource): string {
  const tables = playbook.tables.length ? playbook.tables : ['PrimaryTable']
  const [t0, t1 = tables[0], t2 = tables[0]] = tables
  const metrics = playbook.kpis
    .map((kpi) =>
      [
        `  - name: ${quote(kpi.name)}`,
        `    description: ${quote(kpi.description)}`,
        `    source_tables: ${list(kpi.tables)}`,
        `    confidence: ${kpi.confidence}`,
        `    refresh: ${quote(kpi.freshness)}`,
        `    enabled: ${kpi.enabled}`,
      ].join('\n')
    )
    .join('\n')

  return [
    'playbook:',
    `  name: ${quote(playbook.name)}`,
    `  description: ${quote(playbook.purpose)}`,
    `  version: ${quote(playbook.version)}`,
    `  status: ${quote(playbook.status)}`,
    `  owner: ${quote(playbook.owner)}`,
    '',
    'business_context:',
    `  domain: ${quote(playbook.domainLabel)}`,
    `  business_intent: ${quote(playbook.purpose)}`,
    '  objective: "Automate monitoring and surface exceptions before they become business risk."',
    '',
    'connection:',
    `  mcp_source: ${quote(playbook.dataSources[0] ?? '')}`,
    `  schemas_used: ${list(playbook.dataSources)}`,
    `  tables_used: ${list(tables)}`,
    '',
    'relationships:',
    `  - from: ${quote(t0)}`,
    `    to: ${quote(t1)}`,
    '    type: "foreign_key"',
    `    key: "${keyOf(t0)}"`,
    `  - from: ${quote(t1)}`,
    `    to: ${quote(t2)}`,
    '    type: "foreign_key"',
    `    key: "${keyOf(t1)}"`,
    '',
    'entity_mapping:',
    `  primary_entity: ${quote(t0)}`,
    `  related_entities: ${list(tables.slice(1))}`,
    `  business_domain: ${quote(playbook.domainLabel)}`,
    '',
    'filters:',
    '  - field: "status"',
    '    operator: "not_in"',
    '    value: ["cancelled", "archived"]',
    '  - field: "created_date"',
    '    operator: "within_last"',
    '    value: "90 days"',
    '',
    'business_rules:',
    '  - name: "exclude_test_records"',
    '    condition: "record.is_test == false"',
    '  - name: "flag_exceptions"',
    '    condition: "confidence_score < 0.85"',
    '  - name: "alert_threshold"',
    `    condition: "abs(pct_change) > ${playbook.alertThresholdPct ?? 5}%"`,
    '',
    'aggregations:',
    '  - metric: "count"',
    `    group_by: ${quote(`${t0}.status`)}`,
    '  - metric: "avg"',
    `    group_by: ${quote(`${t0}.created_date`)}`,
    '',
    'metrics:',
    metrics,
    '',
    'output:',
    '  format: "dashboard + narrative_summary"',
    `  channels: ${list(playbook.channels)}`,
    '',
    'prompt_instructions: |',
    `  You are an experienced BI analyst monitoring ${playbook.domainLabel}.`,
    '  Summarize anomalies, cite the specific KPI and table involved,',
    '  and recommend one action when a metric breaches its expected range.',
    '',
    'validation_rules:',
    '  - rule: "no_null_primary_keys"',
    '  - rule: "source_freshness_under_24h"',
    '  - rule: "confidence_above_threshold"',
    '    threshold: 0.80',
    '',
    'security:',
    '  access_level: "role_based"',
    '  pii_masking: "enabled"',
    '  audit_logging: "enabled"',
    '',
    'schedule:',
    `  frequency: ${quote(playbook.frequency)}`,
    '  timezone: "Asia/Kolkata"',
    '',
    'version:',
    `  current: ${quote(playbook.version)}`,
    `  last_modified: ${quote(playbook.modifiedDate)}`,
    `  created: ${quote(playbook.createdDate)}`,
    '',
    'execution_history:',
    `  total_runs: ${playbook.history.length}`,
    `  last_run: ${quote(playbook.lastRun)}`,
    `  next_run: ${quote(playbook.nextRun)}`,
    '',
  ].join('\n')
}

function valueTokens(value: string): YamlToken[] {
  if (!value) return []
  const trimmed = value.trim()
  if (trimmed === '|' || trimmed === '') return [{ kind: 'plain', text: value }]
  if (/^-?\d+(\.\d+)?$/.test(trimmed) || /^(true|false)$/.test(trimmed)) return [{ kind: 'number', text: value }]
  return [{ kind: 'string', text: value }]
}

export function tokenizeYamlLine(raw: string): YamlToken[] {
  let line = raw
  let comment: YamlToken | null = null
  const hash = line.indexOf('#')
  if (hash !== -1) {
    comment = { kind: 'comment', text: line.slice(hash) }
    line = line.slice(0, hash)
  }
  const indent = /^\s*/.exec(line)?.[0] ?? ''
  let rest = line.slice(indent.length)
  const tokens: YamlToken[] = indent ? [{ kind: 'plain', text: indent }] : []
  if (rest.startsWith('- ')) {
    tokens.push({ kind: 'dash', text: '- ' })
    rest = rest.slice(2)
  } else if (rest === '-') {
    tokens.push({ kind: 'dash', text: '-' })
    rest = ''
  }
  const pair = /^([A-Za-z0-9_. ]+?):(\s|$)(.*)$/.exec(rest)
  if (pair) {
    tokens.push({ kind: 'key', text: pair[1] }, { kind: 'mark', text: `:${pair[2]}` }, ...valueTokens(pair[3]))
  } else {
    tokens.push(...valueTokens(rest))
  }
  if (comment) tokens.push(comment)
  return tokens
}

export function diffLines(before: string, after: string): DiffRow[] {
  const a = before.split('\n')
  const b = after.split('\n')
  const n = a.length
  const m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const rows: DiffRow[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ type: 'context', text: a[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'remove', text: a[i] })
      i++
    } else {
      rows.push({ type: 'add', text: b[j] })
      j++
    }
  }
  while (i < n) rows.push({ type: 'remove', text: a[i++] })
  while (j < m) rows.push({ type: 'add', text: b[j++] })
  return rows
}

export function yamlFileName(name: string): string {
  return `${slugifyFilename(name)}.yaml`
}

export function downloadYaml(name: string, yaml: string) {
  triggerDownload(new Blob([yaml], { type: 'text/yaml' }), yamlFileName(name))
}
