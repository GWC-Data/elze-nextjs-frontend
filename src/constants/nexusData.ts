// Static data ported from nexusmcp-ai-dashboard-studio (Playbooks, Executions, Actions).

export type PlaybookStatus = "Active" | "Paused"
export type RunStatus = "Healthy" | "Warning"
export type DomainColor = "blue" | "aqua" | "orange" | "good"

export interface NexusKpi {
  name: string
  description: string
  tables: string[]
  confidence: number
  freshness: string
  enabled: boolean
}

export interface NexusPlaybook {
  id: string
  name: string
  domain: string
  domainColor: DomainColor
  purpose: string
  owner: string
  version: string
  status: PlaybookStatus
  frequency: string
  channels: string[]
  dataSources: string[]
  tables: string[]
  lastRun: string
  nextRun: string
  lastResult: RunStatus
  health: number
  confidence: number
  kpis: NexusKpi[]
  versionHistory: { version: string; date: string; note: string; author: string }[]
}

const k = (name: string, description: string, tables: string[], confidence: number, freshness: string, enabled = true): NexusKpi => ({
  name, description, tables, confidence, freshness, enabled,
})

export const NEXUS_PLAYBOOKS: NexusPlaybook[] = [
  {
    id: "pb-1", name: "Invoice Health Monitoring", domain: "Finance · Invoices", domainColor: "blue",
    purpose: "Monitor the invoice lifecycle daily — from creation through payment — and flag exceptions before they impact working capital.",
    owner: "Siva Ram", version: "v2.3", status: "Active", frequency: "Every 24 Hours", channels: ["Email", "Dashboard only"],
    dataSources: ["Finance ERP", "Invoices", "Customers", "Payments"],
    tables: ["Invoices", "Invoice Lines", "Customers", "Payments", "Finance Ledger"],
    lastRun: "14 minutes ago", nextRun: "In 23 hr 46 min", lastResult: "Healthy", health: 96, confidence: 97,
    kpis: [
      k("Invoice Processing Time", "Average time from invoice receipt to posting", ["INVOICES", "INVOICE_LINES"], 97, "Hourly"),
      k("Invoice Approval Rate", "% of invoices approved without escalation", ["INVOICES", "APPROVALS"], 95, "Hourly"),
      k("Pending Invoice Count", "Invoices awaiting approval or payment", ["INVOICES"], 99, "Real-time"),
      k("Average Invoice Value", "Mean invoice amount across all vendors", ["INVOICES"], 98, "Daily"),
      k("Late Payment %", "Invoices paid after due date vs. total paid", ["PAYMENTS", "INVOICES"], 93, "Daily"),
      k("Invoices Pending > 30 Days", "Aging invoices at risk of SLA breach", ["INVOICES"], 96, "Daily"),
      k("Invoice Exception Rate", "% of invoices flagged for mismatch or error", ["INVOICES", "INVOICE_LINES"], 90, "Hourly"),
      k("Duplicate Invoice Detection", "Potential duplicate invoices identified by AI", ["INVOICES"], 88, "Daily"),
      k("Approval SLA", "% of approvals completed within target window", ["APPROVALS"], 85, "Daily", false),
      k("Rejected Invoice Trend", "Volume of rejected invoices over time", ["INVOICES", "APPROVALS"], 82, "Weekly", false),
    ],
    versionHistory: [
      { version: "v2.3", date: "14 minutes ago", note: "Adjusted Late Payment % threshold.", author: "AI Assistant" },
      { version: "v2.2", date: "4 days ago", note: "Added Duplicate Invoice Detection metric.", author: "Siva Ram" },
      { version: "v2.0", date: "3 weeks ago", note: "Migrated to weekly executive summary format.", author: "Siva Ram" },
      { version: "v1.0", date: "6 weeks ago", note: "Playbook created from an AI Copilot conversation.", author: "Siva Ram" },
    ],
  },
  {
    id: "pb-2", name: "Daily Sales Health", domain: "Sales · Revenue", domainColor: "aqua",
    purpose: "Track daily sales performance across regions and channels, surfacing revenue risk before it shows up in the monthly close.",
    owner: "Priya Nair", version: "v1.4", status: "Active", frequency: "Every 6 Hours", channels: ["Teams", "Dashboard only"],
    dataSources: ["Sales Cloud", "Orders", "Customers", "Products"],
    tables: ["Orders", "Order Items", "Customers", "Products", "Regions"],
    lastRun: "41 minutes ago", nextRun: "In 5 hr 19 min", lastResult: "Healthy", health: 94, confidence: 94,
    kpis: [
      k("Daily Revenue", "Gross revenue booked per day", ["ORDERS"], 98, "Real-time"),
      k("Average Order Value", "Mean order value across all channels", ["ORDERS", "ORDER_ITEMS"], 96, "Hourly"),
      k("Order Fulfillment Rate", "% of orders shipped within SLA window", ["ORDERS"], 94, "Daily"),
      k("New vs Returning Customers", "Share of revenue from new customer acquisition", ["CUSTOMERS", "ORDERS"], 90, "Daily"),
      k("Sales by Region", "Revenue distribution across sales territories", ["ORDERS", "REGIONS"], 95, "Daily"),
      k("Discount Impact", "Revenue erosion attributable to discounting", ["ORDER_ITEMS"], 83, "Weekly", false),
    ],
    versionHistory: [
      { version: "v1.4", date: "41 minutes ago", note: "Refreshed sales-by-region grouping.", author: "AI Assistant" },
      { version: "v1.0", date: "5 weeks ago", note: "Playbook created from an AI Copilot conversation.", author: "Priya Nair" },
    ],
  },
  {
    id: "pb-3", name: "Vendor Performance", domain: "Procurement · Vendors", domainColor: "orange",
    purpose: "Monitor procurement cycle times and vendor SLA compliance to catch delays before they hit production schedules.",
    owner: "Arjun Mehta", version: "v1.1", status: "Active", frequency: "Every 12 Hours", channels: ["Email"],
    dataSources: ["SAP MCP", "Purchase Orders", "Suppliers", "Shipments"],
    tables: ["Purchase Orders", "Suppliers", "Shipments", "Receiving"],
    lastRun: "1 hour ago", nextRun: "In 11 hr 02 min", lastResult: "Warning", health: 81, confidence: 85,
    kpis: [
      k("Average PO Cycle Time", "Time from PO creation to goods receipt", ["PURCHASE_ORDERS"], 94, "Daily"),
      k("Vendor SLA Compliance", "% of deliveries within agreed SLA", ["SUPPLIERS", "SHIPMENTS"], 92, "Daily"),
      k("Delayed Shipments", "Shipments running behind expected arrival", ["SHIPMENTS"], 90, "Real-time"),
      k("Price Variance", "Deviation between quoted and invoiced price", ["PURCHASE_ORDERS"], 86, "Weekly"),
      k("Single-Source Risk", "Spend concentrated with a single supplier", ["SUPPLIERS"], 81, "Weekly", false),
      k("Vendor Performance Score", "Composite AI score across cost, quality, speed", ["SUPPLIERS"], 87, "Weekly", false),
    ],
    versionHistory: [
      { version: "v1.1", date: "1 hour ago", note: "Added Single-Source Risk metric.", author: "Arjun Mehta" },
      { version: "v1.0", date: "2 weeks ago", note: "Playbook created from an AI Copilot conversation.", author: "Arjun Mehta" },
    ],
  },
  {
    id: "pb-4", name: "Warehouse Efficiency", domain: "Operations · Inventory", domainColor: "good",
    purpose: "Track stock movement and warehouse throughput to prevent stockouts and reduce carrying costs.",
    owner: "Priya Nair", version: "v1.0", status: "Paused", frequency: "Weekly", channels: ["Slack", "Dashboard only"],
    dataSources: ["Databricks MCP", "Inventory", "Warehouses", "Shipments"],
    tables: ["Stock Levels", "Warehouses", "Shipments", "Products"],
    lastRun: "3 days ago", nextRun: "Paused", lastResult: "Healthy", health: 88, confidence: 88,
    kpis: [
      k("Inventory Turnover", "Rate stock is sold and replaced over a period", ["STOCK_LEVELS"], 93, "Daily"),
      k("Stockout Rate", "% of SKUs out of stock at time of demand", ["STOCK_LEVELS", "PRODUCTS"], 90, "Real-time"),
      k("Pick-to-Ship Time", "Average time from pick to dispatch", ["WAREHOUSES", "SHIPMENTS"], 95, "Hourly"),
      k("Excess Inventory Value", "Value of slow-moving or excess stock", ["STOCK_LEVELS"], 84, "Weekly"),
      k("Warehouse Utilization", "% of warehouse capacity in active use", ["WAREHOUSES"], 88, "Daily", false),
      k("Damage & Loss Rate", "% of inventory lost to damage or shrinkage", ["STOCK_LEVELS"], 80, "Weekly", false),
    ],
    versionHistory: [{ version: "v1.0", date: "4 weeks ago", note: "Playbook created from an AI Copilot conversation.", author: "Priya Nair" }],
  },
]

const q = (s: string) => `"${s.replace(/"/g, '\\"')}"`
const list = (items: string[]) => `[${items.map(q).join(", ")}]`

export function playbookToYaml(pb: NexusPlaybook): string {
  const metrics = pb.kpis
    .map((m) => `  - name: ${q(m.name)}\n    description: ${q(m.description)}\n    source_tables: ${list(m.tables)}\n    confidence: ${m.confidence}\n    refresh: ${q(m.freshness)}\n    enabled: ${m.enabled}`)
    .join("\n")
  return [
    "playbook:", `  name: ${q(pb.name)}`, `  description: ${q(pb.purpose)}`, `  version: ${q(pb.version)}`,
    `  status: ${q(pb.status.toLowerCase())}`, `  owner: ${q(pb.owner)}`, "",
    "business_context:", `  domain: ${q(pb.domain)}`, "",
    "connection:", `  mcp_source: ${q(pb.dataSources[0])}`, `  schemas_used: ${list(pb.dataSources)}`, `  tables_used: ${list(pb.tables)}`, "",
    "metrics:", metrics, "",
    "output:", '  format: "dashboard + narrative_summary"', `  channels: ${list(pb.channels)}`, "",
  ].join("\n")
}

// ---------------------------------------------------------------- Executions & findings

export interface NexusFinding {
  title: string
  desc: string
  confidence: number
  impact: "High" | "Medium" | "Low"
  metric: string
  suggestedAction: string
  recipients: string[]
}

export interface NexusExecution {
  id: string
  playbookId: string
  playbookName: string
  domain: string
  domainColor: DomainColor
  when: string
  status: RunStatus
  duration: string
  kpiLabel: string
  kpiValue: string
  health: number
  findings: NexusFinding[]
}

const f = (title: string, desc: string, confidence: number, impact: NexusFinding["impact"], metric: string, suggestedAction: string, recipients: string[]): NexusFinding => ({
  title, desc, confidence, impact, metric, suggestedAction, recipients,
})

interface Insight { kpiLabel: string; baseline: number; anomaly: number; fmt: (v: number) => string; findings: NexusFinding[] }

const INSIGHTS: Record<string, Insight> = {
  "pb-1": {
    kpiLabel: "Invoice Approval Time", baseline: 24, anomaly: 28.3, fmt: (v) => `${v.toFixed(1)} hrs`,
    findings: [
      f("Invoice approval delays rising", "Second-level approvals for invoices over ₹5L are taking 2.3 days on average, nearly 3x the queue for lower-value invoices.", 93, "High", "+18% approval time WoW", "Notify the Finance Controller and request a review of second-level sign-off capacity.", ["Finance Controller"]),
      f("Finance approver capacity shortfall", "Two approver seats in the Finance department were vacant this week, creating a backlog at the second-level sign-off step.", 88, "High", "2 vacant seats", "Notify Finance leadership and request a temporary reassignment of sign-off authority.", ["Finance Controller", "Finance Team"]),
      f("Duplicate invoice submissions increasing", "AI duplicate-detection flagged more repeat submissions from the same vendor within a 48-hour window than the prior period.", 84, "Medium", "+3 duplicates flagged", "Notify the Finance Team to confirm the flagged duplicates before payment.", ["Finance Team"]),
      f("Late payment rate climbing", "The share of invoices paid after their due date grew, concentrated among vendors on net-45 terms.", 90, "Medium", "11.8% late vs. 9.0% baseline", "Notify the Finance Controller to review payment terms with affected net-45 vendors.", ["Finance Controller"]),
      f("High-value invoices pending approval", "Three invoices above ₹10 lakh remain unapproved, all originating from the Manufacturing cost center.", 95, "High", "₹1.2Cr pending", "Notify the Finance Controller and Manufacturing cost-center owner for same-day escalation.", ["Finance Controller"]),
    ],
  },
  "pb-2": {
    kpiLabel: "Daily Sales Revenue", baseline: 268, anomaly: 246, fmt: (v) => `₹${v.toFixed(0)}L`,
    findings: [
      f("South Region Sales Decline", "South region revenue declined 14.3% and contributed approximately 48% of the overall sales reduction.", 96, "High", "-14.3% region revenue", "Notify the Regional Sales Head and request a review of distributor activity.", ["Regional Sales Head"]),
      f("Inventory Availability", "Three high-performing products experienced stock availability below the normal threshold, contributing to the sales shortfall.", 91, "Medium", "3 SKUs below threshold", "Notify the Supply Chain Manager to expedite replenishment for the affected products.", ["Supply Chain Manager"]),
      f("Order Fulfillment Delays Linked to Invoicing", "Delayed invoice approvals are pushing back order fulfillment, compounding the regional slowdown.", 87, "High", "+1.4 days fulfillment lag", "Notify the Finance Controller — invoice delays are compounding the fulfillment slowdown.", ["Finance Controller"]),
      f("Reduced Repeat Customer Purchases", "Returning-customer order frequency softened, most visibly among mid-tier accounts in the affected region.", 82, "Medium", "-6% repeat orders", "Notify the Sales Operations Team to launch a mid-tier re-engagement campaign.", ["Sales Operations Team"]),
      f("Increase in Cancelled Orders", "Order cancellations ticked up, concentrated in the same region and time window as the revenue decline.", 79, "Low", "+2.1% cancellation rate", "Notify the Sales Operations Team to investigate the cancellation pattern.", ["Sales Operations Team"]),
    ],
  },
  "pb-3": {
    kpiLabel: "Vendor SLA Compliance", baseline: 91, anomaly: 81, fmt: (v) => `${v.toFixed(0)}%`,
    findings: [
      f("Vendor SLA compliance slipping for one supplier", "Meridian Supplies fell well below its agreed delivery SLA this period, dragging down the blended compliance rate.", 92, "High", "-10pt SLA compliance", "Notify the Procurement Team and escalate an SLA performance review with Meridian Supplies.", ["Procurement Team"]),
      f("PO cycle time increasing on high-value orders", "Purchase orders above the median value are taking longer to move from creation to goods receipt.", 85, "Medium", "+0.9 days cycle time", "Notify the Procurement Team to fast-track approval routing for high-value purchase orders.", ["Procurement Team"]),
      f("Price variance widening versus quoted rates", "Invoiced prices deviated further from quoted rates than in the prior period, mostly on raw-material line items.", 80, "Medium", "+0.6pt variance", "Notify Arjun Mehta to renegotiate quoted pricing where variance exceeds tolerance.", ["Arjun Mehta"]),
      f("Shipment delays concentrated on a single lane", "One logistics lane accounted for a disproportionate share of delayed shipments this period.", 87, "Medium", "+5 delayed shipments", "Notify the Supply Chain Manager to audit the delayed shipment lane.", ["Supply Chain Manager"]),
      f("Single-source risk rising for a critical category", "Spend concentration with one supplier increased in a category with no qualified backup vendor.", 78, "Low", "+4pt concentration", "Notify the Procurement Team to qualify a backup vendor for the category.", ["Procurement Team"]),
    ],
  },
  "pb-4": {
    kpiLabel: "Stockout Rate", baseline: 3, anomaly: 4.6, fmt: (v) => `${v.toFixed(1)}%`,
    findings: [
      f("Stockouts rising for high-demand SKUs", "Two high-demand SKUs fell below safety stock at the Mumbai DC, driving the blended stockout rate up.", 91, "High", "+1.6pt stockout rate", "Notify the Supply Chain Manager to expedite replenishment for the affected SKUs.", ["Supply Chain Manager"]),
      f("Pick-to-ship time increasing at one distribution center", "Average pick-to-ship time at the Mumbai DC rose versus its trailing average, adding to fulfillment delay.", 86, "Medium", "+6 min pick-to-ship", "Notify the Supply Chain Manager to investigate the Mumbai DC slowdown.", ["Supply Chain Manager"]),
      f("Excess inventory building in a slow-moving category", "A slow-moving product category is accumulating excess stock even as fast-movers run short elsewhere.", 80, "Medium", "+₹18L excess value", "Notify the Supply Chain Manager to run a clearance push on the slow-moving category.", ["Supply Chain Manager"]),
      f("Warehouse utilization nearing capacity", "One facility is approaching its practical storage capacity, limiting flexibility to rebalance stock.", 83, "Medium", "92% utilization", "Notify the Supply Chain Manager to plan overflow capacity.", ["Supply Chain Manager"]),
      f("Damage and loss rate ticking up", "Damage and shrinkage during handling rose slightly against the trailing 4-week average.", 76, "Low", "+0.2pt damage rate", "Notify the Supply Chain Manager to audit handling procedures.", ["Supply Chain Manager"]),
    ],
  },
}

const WHENS = ["Today, 6:00 AM", "Yesterday, 6:00 AM", "2 days ago, 6:00 AM", "3 days ago, 6:00 AM", "4 days ago, 6:00 AM"]
const JITTER = [0, -0.012, 0.009, -0.006, 0.014]
const HEALTHY = [0, 94, 92, 96, 93]
const DURATIONS = ["8.4s", "7.2s", "9.1s", "6.8s", "7.7s"]

export const NEXUS_EXECUTIONS: NexusExecution[] = NEXUS_PLAYBOOKS.flatMap((pb, pi) => {
  const cfg = INSIGHTS[pb.id]
  return WHENS.map((when, i): NexusExecution => {
    const anomaly = i === 0
    const value = anomaly ? cfg.anomaly : Math.round(cfg.baseline * (1 + JITTER[i]) * 100) / 100
    return {
      id: `EXE-${84000 + i * 211 + (pi + 1) * 17}`, playbookId: pb.id, playbookName: pb.name, domain: pb.domain,
      domainColor: pb.domainColor, when, status: anomaly ? "Warning" : "Healthy", duration: DURATIONS[i],
      kpiLabel: cfg.kpiLabel, kpiValue: cfg.fmt(value), health: anomaly ? 76 : HEALTHY[i], findings: anomaly ? cfg.findings : [],
    }
  })
}).sort((a, b) => WHENS.indexOf(a.when) - WHENS.indexOf(b.when))

export interface NexusPendingFinding {
  key: string
  playbookName: string
  domain: string
  domainColor: DomainColor
  finding: NexusFinding
}

export const NEXUS_PENDING_FINDINGS: NexusPendingFinding[] = NEXUS_EXECUTIONS.filter(
  (e) => e.when === WHENS[0] && e.status !== "Healthy",
).flatMap((e) =>
  e.findings.map((finding, i) => ({
    key: `${e.playbookId}::${i}`, playbookName: e.playbookName, domain: e.domain, domainColor: e.domainColor, finding,
  })),
)

export const NEXUS_RECIPIENTS = [
  "Regional Sales Head", "Finance Controller", "Supply Chain Manager", "Plant Manager", "Sales Operations Team",
  "Finance Team", "Procurement Team", "Priya Nair", "Arjun Mehta", "Siva Ram", "Executive Leadership", "On-call Ops",
]

export const NEXUS_INITIAL_ACTIVITY = [
  { time: "2 hours ago · Vendor Performance", text: "SLA breach resolved — Acme Logistics back in compliance.", tone: "good" },
  { time: "Yesterday · Invoice Health Monitoring", text: "Notification sent to Finance Controller about approval backlog.", tone: "" },
]
