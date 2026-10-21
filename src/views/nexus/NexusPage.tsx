import * as React from "react"

import "@/styles/nexus.css"
import NexusPlaybooksPage from "./NexusPlaybooksPage"
import NexusExecutionsPage from "./NexusExecutionsPage"
import NexusActionsPage from "./NexusActionsPage"

const TABS = [
  { key: "playbooks", label: "Playbooks", View: NexusPlaybooksPage },
  { key: "executions", label: "Executions", View: NexusExecutionsPage },
  { key: "actions", label: "Actions", View: NexusActionsPage },
] as const

export default function NexusPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]["key"]>("playbooks")
  const Active = TABS.find((t) => t.key === tab)!.View

  return (
    <div className="nx" style={{ background: "var(--page)", minHeight: "100%", overflowY: "auto" }}>
      <div style={{ padding: "20px 28px 0" }}>
        <div className="chip-filters">
          {TABS.map((t) => (
            <button key={t.key} className={`chip ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <Active />
    </div>
  )
}
