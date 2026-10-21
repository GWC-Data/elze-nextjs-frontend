import * as React from "react"
import { toast } from "sonner"
import { Activity, Check, Send, Wand2 } from "lucide-react"

import "@/styles/nexus.css"
import { NEXUS_INITIAL_ACTIVITY, NEXUS_PENDING_FINDINGS, NEXUS_RECIPIENTS, type NexusPendingFinding } from "@/constants/nexusData"

export default function NexusActionsPage() {
  const [filter, setFilter] = React.useState<"pending" | "all">("pending")
  const [sent, setSent] = React.useState<Set<string>>(new Set())
  const [composing, setComposing] = React.useState<string | null>(null)
  const [recipients, setRecipients] = React.useState<string[]>([])
  const [message, setMessage] = React.useState("")
  const [activity, setActivity] = React.useState(NEXUS_INITIAL_ACTIVITY)

  const cards = NEXUS_PENDING_FINDINGS.filter((c) => filter === "all" || !sent.has(c.key))

  const open = (c: NexusPendingFinding) => {
    setComposing(c.key)
    setRecipients(c.finding.recipients)
    setMessage(`${c.finding.title} (${c.playbookName}): ${c.finding.desc} ${c.finding.suggestedAction}`)
  }
  const send = (c: NexusPendingFinding) => {
    if (!recipients.length) return toast.error("Pick at least one recipient.")
    setSent((p) => new Set(p).add(c.key))
    setActivity((p) => [{ time: `Just now · ${c.playbookName}`, text: `"${c.finding.title}" sent to ${recipients.join(", ")}.`, tone: "good" }, ...p])
    setComposing(null)
    toast.success("Action sent.")
  }

  return (
    <div className="nx" style={{ padding: 28, background: "var(--page)", minHeight: "100%", overflowY: "auto" }}>
      <div className="section-heading">
        <h3>Findings Waiting On You</h3>
        <div className="chip-filters">
          <button className={`chip ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>Needs Action</button>
          <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All Activity</button>
        </div>
      </div>
      <p className="muted-note tab-intro" style={{ marginBottom: 16 }}>Every finding that could become a real business action, aggregated across all Playbooks — with a full traceable history of what&apos;s already been sent.</p>
      <div className="action-center-grid">
        <div className="action-list">
          {cards.length === 0 && <div style={{ color: "var(--muted)" }}>Nothing needs action right now — every recent finding has been handled.</div>}
          {cards.map((c) => (
            <div key={c.key} className="action-card" style={{ flexWrap: "wrap" }}>
              <div className="action-card-body">
                <span className={`domain-tag ${c.domainColor}`} style={{ marginBottom: 6, display: "inline-block" }}>{c.domain}</span>
                <h5>{c.finding.title} <span className="muted-note" style={{ fontWeight: 500 }}>· {c.playbookName}</span></h5>
                <p className="action-card-finding">{c.finding.desc}</p>
                <div className="action-card-suggestion"><Wand2 className="ic sm" /><span>{c.finding.suggestedAction}</span></div>
              </div>
              {sent.has(c.key)
                ? <span className="action-card-actioned"><Check className="ic sm" />Action sent</span>
                : <button className="btn btn-primary sm" onClick={() => open(c)}><Send className="ic sm" />Take Action</button>}
              {composing === c.key && (
                <div style={{ flexBasis: "100%", borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {NEXUS_RECIPIENTS.map((n) => (
                      <button key={n} className={`chip ${recipients.includes(n) ? "active" : ""}`} onClick={() => setRecipients((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n])}>{n}</button>
                    ))}
                  </div>
                  <textarea className="action-message-textarea" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button className="btn btn-ghost sm" onClick={() => setComposing(null)}>Cancel</button>
                    <button className="btn btn-primary sm" onClick={() => send(c)}><Send className="ic sm" />Send</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="glass panel action-center-feed-panel">
          <div className="panel-head sm"><h4 style={{ display: "flex", gap: 7, alignItems: "center" }}><Activity className="ic sm" />Recent Action Activity</h4></div>
          <ol className="action-activity-feed">
            {activity.map((a, i) => (
              <li key={i} className={`action-activity-item ${a.tone}`}>
                <span className="action-activity-dot" />
                <div><div className="action-activity-time">{a.time}</div><div className="action-activity-text">{a.text}</div></div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
