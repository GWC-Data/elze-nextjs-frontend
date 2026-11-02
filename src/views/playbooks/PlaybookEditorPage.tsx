'use client'

import { useState } from 'react'
import { useParams, useSearchParams } from '@/lib/router'
import { Bot, Download, FileCode, GitCompareArrows, History, Lock, LockOpen, Save, Tag } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { usePaths } from '@/hooks/usePaths'
import { notify } from '@/lib/notify'
import { ASSISTANT_GREETING, respond } from '@/lib/playbookAssistant'
import type { AssistantReply } from '@/lib/playbookAssistant'
import { downloadYaml, generateYaml, yamlFileName } from '@/lib/playbookYaml'
import { Page, PageHeader, Section } from '@/components/common/Page'
import { SearchBox } from '@/components/common/SearchBox'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { usePlaybookStore } from '@/components/common/playbooks/PlaybookStore'
import { PlaybookNotFound } from '@/components/common/playbooks/PlaybookNotFound'
import { YamlView } from '@/components/common/playbooks/YamlView'
import { CompareChangesDialog } from '@/components/common/playbooks/CompareChangesDialog'
import { EditorAssistant } from '@/components/common/playbooks/EditorAssistant'
import { PlaybookStatusBadge, WARNING_TEXT } from '@/components/common/playbooks/PlaybookBadges'
import type { AssistantMessage, Playbook, PlaybookDraft } from '@/types/playbooks'

type Panel = 'assistant' | 'versions'

const GREETING: AssistantMessage = { id: 'greeting', role: 'assistant', text: ASSISTANT_GREETING }
const MANUAL_NOTE = 'Manual edits to the YAML definition.'
const PANE_HEIGHT = 'h-[68vh] min-h-96'

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'Y'
  )
}

export default function PlaybookEditorPage() {
  const { playbookId } = useParams<{ playbookId: string }>()
  const { playbooks } = usePlaybookStore()
  const playbook = playbooks.find((item) => item.id === playbookId)
  if (!playbook) return <PlaybookNotFound />
  return <PlaybookEditor key={playbook.id} playbook={playbook} />
}

function PlaybookEditor({ playbook }: { playbook: Playbook }) {
  const paths = usePaths()
  const store = usePlaybookStore()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const author = user?.displayName || user?.username || 'You'

  const [panel, setPanel] = useState<Panel>(params.get('tab') === 'versions' ? 'versions' : 'assistant')
  const [draft, setDraft] = useState<PlaybookDraft>(() => ({
    kpis: playbook.kpis,
    frequency: playbook.frequency,
    alertThresholdPct: playbook.alertThresholdPct,
  }))
  const [yaml, setYaml] = useState(playbook.yaml)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(playbook.yaml)
  const [dirty, setDirty] = useState(false)
  const [notes, setNotes] = useState<string[]>([])
  const [aiEdited, setAiEdited] = useState(false)
  const [search, setSearch] = useState('')
  const [flash, setFlash] = useState<string[]>([])
  const [removing, setRemoving] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  const [typing, setTyping] = useState(false)

  const manual = editing && editText !== yaml
  const currentYaml = manual ? editText : yaml
  const unsaved = dirty || manual
  const messages = playbook.chat.length > 0 ? playbook.chat : [GREETING]

  const markDirty = (note?: string) => {
    setDirty(true)
    if (note) setNotes((previous) => [...previous, note])
  }

  const toggleMode = () => {
    if (!editing) {
      setEditText(yaml)
      setEditing(true)
      return
    }
    if (manual) {
      setYaml(editText)
      setAiEdited(false)
      markDirty(MANUAL_NOTE)
    }
    setEditing(false)
  }

  const save = () => {
    if (!unsaved) {
      notify.success('No changes to save.')
      return
    }
    const allNotes = manual ? [...notes, MANUAL_NOTE] : notes
    const note = allNotes.length > 0 ? allNotes.join(' ') : 'Manual edits saved.'
    const version = store.save(
      playbook.id,
      { ...draft, yaml: currentYaml },
      note,
      aiEdited && !manual ? 'AI Assistant' : author
    )
    if (manual) setYaml(editText)
    setDirty(false)
    setNotes([])
    setAiEdited(false)
    if (version) notify.success(`Saved ${playbook.name} as ${version}.`)
  }

  const exportYaml = () => {
    downloadYaml(playbook.name, currentYaml)
    notify.success(`Exported ${yamlFileName(playbook.name)}.`)
  }

  const applyReply = (reply: AssistantReply, thread: AssistantMessage[]) => {
    const finish = () => {
      if (reply.draft) {
        const next = reply.draft
        const regenerated = generateYaml({ ...playbook, ...next })
        setDraft(next)
        setYaml(regenerated)
        setEditText(regenerated)
        setAiEdited(true)
        markDirty(reply.note)
      }
      if (reply.highlight?.length) {
        setFlash(reply.highlight)
        window.setTimeout(() => setFlash([]), 1800)
      }
      store.setChat(playbook.id, [...thread, { id: crypto.randomUUID(), role: 'assistant', text: reply.text }])
    }
    if (reply.remove?.length) {
      setRemoving(reply.remove)
      window.setTimeout(() => {
        setRemoving([])
        finish()
      }, 620)
      return
    }
    finish()
  }

  const sendMessage = (text: string) => {
    const thread: AssistantMessage[] = [...messages, { id: crypto.randomUUID(), role: 'user', text }]
    store.setChat(playbook.id, thread)
    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      applyReply(respond(text, draft, { domainLabel: playbook.domainLabel, tables: playbook.tables }), thread)
    }, 800)
  }

  const lineCount = currentYaml.split('\n').length

  return (
    <Page>
      <PageHeader
        crumbs={[
          { label: 'Playbooks', to: paths.playbooks },
          { label: playbook.name, to: paths.playbook(playbook.id) },
          { label: 'Edit' },
        ]}
        title={yamlFileName(playbook.name)}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Tag className="size-3.5" aria-hidden />
              {playbook.version}
            </span>
            <PlaybookStatusBadge status={playbook.status} />
            {unsaved ? (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${WARNING_TEXT}`}>
                <span className="size-1.5 animate-pulse rounded-full bg-warning" aria-hidden />
                Unsaved changes
              </span>
            ) : null}
            <span>
              {playbook.domainLabel} · {playbook.tables.length} tables · AI confidence {playbook.aiConfidence}%
            </span>
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={toggleMode} aria-pressed={editing}>
              {editing ? <LockOpen aria-hidden /> : <Lock aria-hidden />}
              {editing ? 'Editing' : 'Read-only'}
            </Button>
            <Button variant="outline" onClick={exportYaml}>
              <Download aria-hidden />
              Export YAML
            </Button>
            <Button variant="outline" onClick={() => setComparing(true)}>
              <GitCompareArrows aria-hidden />
              Compare changes
            </Button>
            <Button onClick={save}>
              <Save aria-hidden />
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Section
          className="mt-0"
          flush
          title={
            <span className="inline-flex items-center gap-1.5 font-mono">
              <FileCode className="size-4" aria-hidden />
              playbook.yaml
              <span className="font-sans text-xs font-normal text-muted-foreground tabular-nums">{lineCount} lines</span>
            </span>
          }
          actions={
            <SearchBox value={search} onChange={setSearch} placeholder="Search YAML…" label="Search the YAML" className="sm:w-60" />
          }
        >
          {editing ? (
            <Textarea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              spellCheck={false}
              aria-label="Playbook YAML"
              className={`${PANE_HEIGHT} resize-none rounded-none border-0 font-mono text-xs leading-5 shadow-none focus-visible:ring-0`}
            />
          ) : (
            <YamlView yaml={yaml} search={search} flash={flash} removing={removing} className={PANE_HEIGHT} />
          )}
        </Section>

        <Section className="mt-0" flush>
          <Tabs value={panel} onValueChange={(value) => setPanel(value as Panel)} className="gap-0">
            <div className="border-b px-4 pt-2">
              <TabsList variant="line">
                <TabsTrigger value="assistant">
                  <Bot aria-hidden />
                  AI assistant
                </TabsTrigger>
                <TabsTrigger value="versions">
                  <History aria-hidden />
                  Version history
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="assistant">
              <EditorAssistant
                messages={messages}
                typing={typing}
                initials={initialsOf(author)}
                onSend={sendMessage}
                className={PANE_HEIGHT}
              />
            </TabsContent>
            <TabsContent value="versions">
              <ol className={`${PANE_HEIGHT} divide-y overflow-y-auto`}>
                {playbook.versions.map((version) => (
                  <li key={version.version} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                        <Tag className="size-3" aria-hidden />
                        {version.version}
                      </span>
                      <span className="text-xs text-muted-foreground">{version.date}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{version.note}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">by {version.author}</p>
                  </li>
                ))}
              </ol>
            </TabsContent>
          </Tabs>
        </Section>
      </div>

      <CompareChangesDialog
        open={comparing}
        onClose={() => setComparing(false)}
        name={playbook.name}
        version={playbook.version}
        dirty={unsaved}
        before={playbook.savedYaml}
        after={currentYaml}
      />
    </Page>
  )
}
