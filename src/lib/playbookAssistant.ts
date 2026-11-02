import type { PlaybookDraft, PlaybookKpi } from '@/types/playbooks'

export const EDITOR_SUGGESTIONS = [
  'Explain this KPI.',
  'Why are these tables selected?',
  'Add supplier analysis.',
  'Remove duplicate detection.',
  'Change the threshold to 8%.',
  'Run this every six hours.',
]

export const ASSISTANT_GREETING =
  'I understand this playbook’s full YAML — schema sources, metrics, business rules and schedule. Ask me to explain any section, or tell me what to change and I’ll draft the YAML update for your review.'

const SAVE_HINT = ' Save to commit it as a new version.'
const FREQUENCIES = ['Every Hour', 'Every 6 Hours', 'Every 12 Hours', 'Every 24 Hours', 'Weekly']

export interface AssistantReply {
  text: string
  highlight?: string[]
  remove?: string[]
  draft?: PlaybookDraft
  note?: string
}

interface AssistantContext {
  domainLabel: string
  tables: string[]
}

function withKpis(draft: PlaybookDraft, kpis: PlaybookKpi[]): PlaybookDraft {
  return { ...draft, kpis }
}

function schedule(draft: PlaybookDraft, frequency: string, note: string, text: string): AssistantReply {
  return {
    text: `${text} The \`schedule\` section has been updated and highlighted.${SAVE_HINT}`,
    draft: { ...draft, frequency },
    highlight: ['frequency', frequency],
    note,
  }
}

export function respond(input: string, draft: PlaybookDraft, context: AssistantContext): AssistantReply {
  const t = input.toLowerCase()

  if (t.includes('explain')) {
    const kpi = draft.kpis[0]
    if (kpi) {
      return {
        text: `The **${kpi.name}** metric measures ${kpi.description.toLowerCase()}. It draws from ${kpi.tables.join(', ')}, currently at ${kpi.confidence}% confidence and refreshed ${kpi.freshness.toLowerCase()}. Its definition is under \`metrics\`.`,
        highlight: [kpi.name],
      }
    }
  }

  if (t.includes('why') && t.includes('table')) {
    return {
      text: `These tables surfaced from the enterprise knowledge graph as the ones most connected to the ${context.domainLabel.toLowerCase()} entity cluster, holding the foreign-key relationships this workflow needs: ${context.tables.join(', ')}.`,
      highlight: ['tables_used'],
    }
  }

  if (t.includes('add') && t.includes('supplier')) {
    if (draft.kpis.some((kpi) => kpi.name === 'Supplier Analysis')) {
      return { text: 'This playbook already tracks **Supplier Analysis**.', highlight: ['Supplier Analysis'] }
    }
    const kpi: PlaybookKpi = {
      name: 'Supplier Analysis',
      description: 'Concentration and reliability of spend by supplier',
      tables: ['Suppliers', 'Purchase Orders'],
      confidence: 84,
      freshness: 'Weekly',
      enabled: true,
      trend: [40, 42, 39, 45, 44, 46, 43, 48],
    }
    return {
      text: `Added a **Supplier Analysis** metric sourced from Suppliers and Purchase Orders.${SAVE_HINT}`,
      draft: withKpis(draft, [...draft.kpis, kpi]),
      highlight: [kpi.name],
      note: 'Added Supplier Analysis metric via AI Assistant.',
    }
  }

  if (t.includes('remove') && t.includes('duplicate')) {
    const kpi = draft.kpis.find((item) => item.name.toLowerCase().includes('duplicate'))
    if (!kpi) return { text: 'I don’t see a duplicate-detection metric on this playbook.' }
    return {
      text: `Removed **${kpi.name}**.${SAVE_HINT}`,
      draft: withKpis(draft, draft.kpis.filter((item) => item !== kpi)),
      remove: [kpi.name],
      note: `Removed ${kpi.name} via AI Assistant.`,
    }
  }

  if (t.includes('threshold')) {
    const match = /(\d+(?:\.\d+)?)\s*%/.exec(input)
    const pct = match ? Number(match[1]) : (draft.alertThresholdPct ?? 5) + 1
    return {
      text: `Updated the alert threshold to **${pct}%** — you’ll only be alerted when the change exceeds this. The \`alert_threshold\` rule is highlighted.${SAVE_HINT}`,
      draft: { ...draft, alertThresholdPct: pct },
      highlight: ['alert_threshold', `${pct}%`],
      note: `Updated the alert threshold to ${pct}% via AI Assistant.`,
    }
  }

  if (t.includes('monitor') && t.includes('delay')) {
    const index = draft.kpis.findIndex((kpi) => kpi.name.toLowerCase().includes('approval rate'))
    const kpi: PlaybookKpi = {
      name: 'Approval Delay',
      description: 'Average time an invoice sits awaiting approval',
      tables: ['Invoices', 'Approvals'],
      confidence: 91,
      freshness: 'Hourly',
      enabled: true,
      trend: [1.8, 2.0, 1.7, 2.2, 2.4, 2.1, 2.5, 2.3],
    }
    if (index > -1) {
      const previous = draft.kpis[index].name
      return {
        text: `Swapped **${previous}** for **Approval Delay** — this tracks time-in-queue instead of a pass/fail rate, using the same Invoices and Approvals tables.${SAVE_HINT}`,
        draft: withKpis(draft, draft.kpis.map((item, i) => (i === index ? kpi : item))),
        remove: [previous],
        highlight: [kpi.name],
        note: `Replaced ${previous} with Approval Delay via AI Assistant.`,
      }
    }
    return {
      text: `Added an **Approval Delay** metric tracking time-in-queue for pending approvals.${SAVE_HINT}`,
      draft: withKpis(draft, [...draft.kpis, kpi]),
      highlight: [kpi.name],
      note: 'Added Approval Delay metric via AI Assistant.',
    }
  }

  if (t.includes('weekly')) {
    return schedule(draft, 'Weekly', 'Changed refresh schedule to Weekly via AI Assistant.', `Schedule converted to **Weekly** (was ${draft.frequency}).`)
  }

  if (t.includes('six hours') || t.includes('6 hours')) {
    return schedule(
      draft,
      'Every 6 Hours',
      'Changed refresh schedule to every six hours via AI Assistant.',
      `Schedule converted to **Every 6 Hours** (was ${draft.frequency}).`
    )
  }

  if (t.includes('refresh interval') || t.includes('change refresh')) {
    const next = FREQUENCIES[(FREQUENCIES.indexOf(draft.frequency) + 1) % FREQUENCIES.length]
    return schedule(
      draft,
      next,
      `Changed refresh interval from ${draft.frequency} to ${next} via AI Assistant.`,
      `Updated the refresh interval to **${next}**.`
    )
  }

  return {
    text: 'Based on this playbook’s current YAML — its metrics, business rules and schedule — that looks consistent with the connected schema. Tell me specifically what to add, remove or change and I’ll draft the update for your review.',
  }
}
