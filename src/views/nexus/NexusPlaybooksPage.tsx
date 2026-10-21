import * as React from "react"
import { toast } from "sonner"
import { Check, Clock, Code, Copy, Download, Eye, MoreHorizontal, Pause, Play, Wand2, X } from "lucide-react"

import "@/styles/nexus.css"
import { NEXUS_PLAYBOOKS, playbookToYaml, type NexusPlaybook } from "@/constants/nexusData"

const pillClass = (s: string) => (s === "Healthy" ? "good" : s === "Warning" ? "warning" : "critical")
const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

export default function NexusPlaybooksPage() {
  const [playbooks, setPlaybooks] = React.useState<NexusPlaybook[]>(NEXUS_PLAYBOOKS)
  const [menuId, setMenuId] = React.useState<string | null>(null)
  const [viewId, setViewId] = React.useState<string | null>(null)
  const [yamlId, setYamlId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const close = () => setMenuId(null)
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [])

  const patch = (id: string, p: Partial<NexusPlaybook>) => setPlaybooks((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)))

  const run = (pb: NexusPlaybook) => {
    patch(pb.id, { lastRun: "Just now", lastResult: "Healthy" })
    toast.success(`${pb.name} executed successfully.`)
  }
  const toggle = (pb: NexusPlaybook) => {
    const pause = pb.status === "Active"
    patch(pb.id, { status: pause ? "Paused" : "Active", nextRun: pause ? "Paused" : "Per schedule" })
    toast.success(`${pb.name} ${pause ? "paused" : "resumed"}.`)
  }
  const duplicate = (pb: NexusPlaybook) => {
    const copy: NexusPlaybook = {
      ...pb, id: `pb-${Date.now()}`, name: `${pb.name} (Copy)`, status: "Paused", version: "v1.0", lastRun: "Never run", nextRun: "Paused",
      versionHistory: [{ version: "v1.0", date: "Just now", note: `Duplicated from ${pb.name}.`, author: pb.owner }],
    }
    setPlaybooks((prev) => [copy, ...prev])
    toast.success(`Duplicated as "${copy.name}".`)
  }
  const exportYaml = (pb: NexusPlaybook) => {
    const url = URL.createObjectURL(new Blob([playbookToYaml(pb)], { type: "text/yaml" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `${slug(pb.name)}.yaml`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success(`${pb.name} exported as YAML.`)
  }
  const remove = (pb: NexusPlaybook) => {
    setPlaybooks((prev) => prev.filter((x) => x.id !== pb.id))
    toast.error(`${pb.name} deleted.`)
  }

  return (
    <div className="nx" style={{ padding: 28, background: "var(--page)", minHeight: "100%", overflowY: "auto" }}>
      <div className="section-heading">
        <div>
          <h3>Your Playbooks</h3>
          <p className="muted-note">Manage automated, scheduled AI insight playbooks.</p>
        </div>
      </div>
      <div className="playbook-grid">
        {playbooks.map((pb) => {
          const paused = pb.status === "Paused"
          const hasInsight = pb.lastResult !== "Healthy"
          const viewing = viewId === pb.id
          return (
            <div key={pb.id} className="playbook-card glass" style={{ cursor: "pointer" }} onClick={() => setViewId(viewing ? null : pb.id)}>
              <div className="playbook-card-top">
                <div>
                  <span className={`domain-tag ${pb.domainColor}`}>{pb.domain}</span>
                  <h4 style={{ marginTop: 8 }}>{pb.name}</h4>
                </div>
                <div className="pb-kebab-wrap">
                  <button className="btn btn-ghost sm" onClick={(e) => { e.stopPropagation(); setMenuId(menuId === pb.id ? null : pb.id) }}>
                    <MoreHorizontal className="ic sm" />
                  </button>
                  {menuId === pb.id && (
                    <div className="pb-kebab-menu" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setMenuId(null); duplicate(pb) }}><Copy className="ic sm" />Duplicate</button>
                      <button onClick={() => { setMenuId(null); exportYaml(pb) }}><Download className="ic sm" />Export YAML</button>
                      <button onClick={() => { setMenuId(null); setViewId(pb.id) }}><Clock className="ic sm" />Version History</button>
                      <button className="danger" onClick={() => { setMenuId(null); remove(pb) }}><X className="ic sm" />Delete</button>
                    </div>
                  )}
                </div>
              </div>
              <p className="playbook-purpose">{pb.purpose}</p>
              <div className="pb-status-row">
                <span className={`status-pill ${paused ? "warning" : "good"} sm`}>{!paused && <span className="pulse-dot" />}{pb.status}</span>
                <span className={`status-pill ${pillClass(pb.lastResult)} sm`}>{pb.lastResult}</span>
              </div>
              <div className="playbook-meta-grid pb-grid3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <div><span>Frequency</span><strong>{pb.frequency}</strong></div>
                <div><span>Last Execution</span><strong>{pb.lastRun}</strong></div>
                <div><span>Next Run</span><strong>{pb.nextRun}</strong></div>
              </div>
              <div className="playbook-card-foot">
                <div className="playbook-health">
                  <div className={`health-ring ${pb.health < 85 ? "warn" : ""}`} style={{ ["--pct" as string]: pb.health }}><span>{pb.health}</span></div>
                  Health · {pb.confidence}% confidence
                </div>
                <span className={`pb-insight-badge ${hasInsight ? "warn" : "ok"}`}>
                  {hasInsight ? <Wand2 className="ic sm" /> : <Check className="ic sm" />}
                  {hasInsight ? "New insight surfaced" : "No anomalies"}
                </span>
              </div>
              <div className="playbook-actions-row" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-secondary sm" onClick={() => setViewId(viewing ? null : pb.id)}><Eye className="ic sm" />View</button>
                <button className="btn btn-secondary sm" onClick={() => run(pb)}><Play className="ic sm" />Run Now</button>
                <button className="btn btn-secondary sm" onClick={() => setYamlId(yamlId === pb.id ? null : pb.id)}><Code className="ic sm" />Edit Playbook</button>
                <button className="btn btn-ghost sm" onClick={() => toggle(pb)}>{paused ? <Play className="ic sm" /> : <Pause className="ic sm" />}{paused ? "Resume" : "Pause"}</button>
              </div>
              {viewing && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }} onClick={(e) => e.stopPropagation()}>
                  <strong style={{ fontSize: 12.5 }}>Metrics</strong>
                  {pb.kpis.map((m) => (
                    <div key={m.name} style={{ opacity: m.enabled ? 1 : 0.5 }}>
                      <div style={{ fontWeight: 650, fontSize: 12.5 }}>{m.name} <span className="muted-note">· {m.confidence}% · {m.freshness}</span></div>
                      <div className="muted-note">{m.description}</div>
                    </div>
                  ))}
                  <strong style={{ fontSize: 12.5 }}>Version history</strong>
                  {pb.versionHistory.map((v) => (
                    <div key={v.version} className="muted-note"><strong style={{ color: "var(--ink)" }}>{v.version}</strong> · {v.date} · {v.note} — {v.author}</div>
                  ))}
                </div>
              )}
              {yamlId === pb.id && (
                <pre onClick={(e) => e.stopPropagation()} style={{ margin: 0, maxHeight: 320, overflow: "auto", background: "#1e1e1e", color: "#d4d4d4", borderRadius: 12, padding: "12px 14px", fontSize: 11.5, lineHeight: 1.55 }}>
                  {playbookToYaml(pb)}
                </pre>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
