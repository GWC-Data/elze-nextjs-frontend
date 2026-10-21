import * as React from "react"
import { ChevronRight, Search } from "lucide-react"

import "@/styles/nexus.css"
import { NEXUS_EXECUTIONS, NEXUS_PLAYBOOKS } from "@/constants/nexusData"

const CHIPS = [
  { label: "All", value: "" },
  { label: "Needs Attention", value: "Warning" },
  { label: "Healthy", value: "Healthy" },
]

export default function NexusExecutionsPage() {
  const [status, setStatus] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [pb, setPb] = React.useState("")
  const [domain, setDomain] = React.useState("")
  const [openId, setOpenId] = React.useState<string | null>(null)

  const domains = Array.from(new Set(NEXUS_PLAYBOOKS.map((p) => p.domain)))
  const q = search.trim().toLowerCase()
  const rows = NEXUS_EXECUTIONS.filter(
    (e) => (!status || e.status === status) && (!pb || e.playbookId === pb) && (!domain || e.domain === domain) && (!q || e.playbookName.toLowerCase().includes(q)),
  )

  return (
    <div className="nx" style={{ padding: 28, background: "var(--page)", minHeight: "100%", overflowY: "auto" }}>
      <div className="section-heading">
        <h3>Every Execution, One Place</h3>
        <div className="chip-filters">
          {CHIPS.map((c) => (
            <button key={c.label} className={`chip ${status === c.value ? "active" : ""}`} onClick={() => setStatus(c.value)}>{c.label}</button>
          ))}
        </div>
      </div>
      <div className="dash-lib-toolbar">
        <div className="search-box"><Search className="ic" /><input placeholder="Search by Playbook name…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="dash-lib-select" value={pb} onChange={(e) => setPb(e.target.value)}>
          <option value="">All Playbooks</option>
          {NEXUS_PLAYBOOKS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="dash-lib-select" value={domain} onChange={(e) => setDomain(e.target.value)}>
          <option value="">All Domains</option>
          {domains.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="exec-lib-table-wrap glass panel">
        <table className="exec-lib-table">
          <thead>
            <tr><th>Playbook</th><th>Domain</th><th>When</th><th>Status</th><th>KPI</th><th>Health</th><th>Findings</th><th /></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8}><div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No executions match these filters.</div></td></tr>}
            {rows.map((e) => {
              const open = openId === e.id
              return (
                <React.Fragment key={e.id}>
                  <tr onClick={() => setOpenId(open ? null : e.id)}>
                    <td><span className="exec-lib-pb-name">{e.playbookName}</span></td>
                    <td><span className={`domain-tag ${e.domainColor}`}>{e.domain}</span></td>
                    <td>{e.when}</td>
                    <td><span className={`status-pill ${e.status === "Healthy" ? "good" : "warning"} sm`}>{e.status}</span></td>
                    <td>{e.kpiLabel}: <strong>{e.kpiValue}</strong></td>
                    <td><span className="muted-note">{e.health}</span></td>
                    <td>{e.findings.length ? <span className="impact-badge high">{e.findings.length} finding{e.findings.length === 1 ? "" : "s"}</span> : <span className="impact-badge low">None</span>}</td>
                    <td><ChevronRight className="ic sm" style={{ color: "var(--muted)", transform: open ? "rotate(90deg)" : undefined }} /></td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={8} style={{ background: "var(--surface-2)", cursor: "default" }}>
                        <div className="muted-note" style={{ marginBottom: 8 }}>{e.id} · duration {e.duration}</div>
                        {e.findings.length === 0 ? <div className="muted-note">No anomalies detected in this run.</div> : e.findings.map((f) => (
                          <div key={f.title} style={{ marginBottom: 10 }}>
                            <div style={{ fontWeight: 700, fontSize: 12.5 }}>{f.title} <span className={`impact-badge ${f.impact.toLowerCase()}`}>{f.impact}</span> <span className="muted-note">{f.metric} · {f.confidence}% confidence</span></div>
                            <div className="muted-note">{f.desc}</div>
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
