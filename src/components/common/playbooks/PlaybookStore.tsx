'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/authContext'
import { PLAYBOOK_SEEDS } from '@/constants/playbookSamples'
import {
  ACTION_CHANNELS,
  buildExecutions,
  clockLabel,
  createPlaybook,
  freshExecution,
  nextClock,
} from '@/lib/playbookInsights'
import { generateYaml } from '@/lib/playbookYaml'
import type {
  ActionRequest,
  ActivityItem,
  AssistantMessage,
  Execution,
  Playbook,
  PlaybookDraft,
} from '@/types/playbooks'

interface PlaybookState {
  playbooks: Playbook[]
  executions: Record<string, Execution[]>
  sequence: number
}

export interface SendActionInput {
  playbookId: string
  executionId: string
  findingIndex: number
  request: ActionRequest
}

interface PlaybookStore {
  playbooks: Playbook[]
  executions: Record<string, Execution[]>
  actor: string
  completeRun: (playbookId: string) => void
  setPaused: (playbookId: string, paused: boolean) => void
  duplicate: (playbookId: string) => Playbook | null
  remove: (playbookId: string) => void
  save: (playbookId: string, draft: PlaybookDraft & { yaml: string }, note: string, author: string) => string | null
  setChat: (playbookId: string, chat: AssistantMessage[]) => void
  sendAction: (input: SendActionInput) => void
}

const PlaybookStoreContext = createContext<PlaybookStore | null>(null)

function initialState(): PlaybookState {
  const playbooks = PLAYBOOK_SEEDS.map(createPlaybook)
  return {
    playbooks,
    executions: Object.fromEntries(playbooks.map((playbook) => [playbook.id, buildExecutions(playbook)])),
    sequence: 100 + playbooks.length,
  }
}

function bumpVersion(version: string): string {
  const [major = 1, minor = 0] = version.replace(/^v/, '').split('.').map(Number)
  return `v${major}.${minor + 1}`
}

function activityGap(): number {
  return nextClock(0)
}

function appendActivity(
  execution: Execution,
  entries: Pick<ActivityItem, 'text' | 'tone'>[],
  gaps: number[]
): Execution {
  let clock = execution.clock
  const items = entries.map((entry, index): ActivityItem => {
    clock += gaps[index] ?? 1
    return { id: `${execution.id}-${execution.activity.length + index}`, time: clockLabel(clock), ...entry }
  })
  return { ...execution, clock, activity: [...execution.activity, ...items] }
}

function patchExecution(
  state: PlaybookState,
  playbookId: string,
  executionId: string,
  patch: (execution: Execution) => Execution
): PlaybookState {
  const runs = state.executions[playbookId]
  if (!runs) return state
  return {
    ...state,
    executions: {
      ...state.executions,
      [playbookId]: runs.map((execution) => (execution.id === executionId ? patch(execution) : execution)),
    },
  }
}

export function PlaybookStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const actor = user?.displayName || user?.username || 'You'
  const [state, setState] = useState<PlaybookState>(initialState)

  const store = useMemo<PlaybookStore>(() => {
    const find = (playbookId: string) => state.playbooks.find((playbook) => playbook.id === playbookId)
    const reviewer = actor.split(/\s+/)[0]

    return {
      playbooks: state.playbooks,
      executions: state.executions,
      actor,

      completeRun: (playbookId) => {
        setState((current) => {
          const playbook = current.playbooks.find((item) => item.id === playbookId)
          if (!playbook) return current
          const sequence = current.sequence + 1
          const run = freshExecution(playbook, sequence)
          return {
            ...current,
            sequence,
            playbooks: current.playbooks.map((item) =>
              item.id === playbookId
                ? {
                    ...item,
                    status: 'active',
                    lastRun: 'Just now',
                    nextRun: `Per schedule (${item.frequency})`,
                    history: [{ status: 'healthy', when: 'Just now', duration: run.duration, stepsCompleted: 8 }, ...item.history],
                  }
                : item
            ),
            executions: {
              ...current.executions,
              [playbookId]: [run, ...(current.executions[playbookId] ?? [])].slice(0, 5),
            },
          }
        })
      },

      setPaused: (playbookId, paused) => {
        setState((current) => ({
          ...current,
          playbooks: current.playbooks.map((item) =>
            item.id === playbookId ? { ...item, status: paused ? 'paused' : 'active' } : item
          ),
        }))
      },

      duplicate: (playbookId) => {
        const playbook = find(playbookId)
        if (!playbook) return null
        const sequence = state.sequence + 1
        const base: Playbook = {
          ...playbook,
          id: `pb-${sequence}`,
          name: `${playbook.name} (Copy)`,
          status: 'paused',
          version: 'v1.0',
          lastRun: 'Never run',
          nextRun: 'Paused',
          kpis: playbook.kpis.map((kpi) => ({ ...kpi })),
          versions: [{ version: 'v1.0', date: 'Just now', note: `Duplicated from ${playbook.name}.`, author: actor }],
          history: [],
          chat: [],
        }
        const yaml = generateYaml(base)
        const copy: Playbook = { ...base, yaml, savedYaml: yaml }
        setState((current) => ({
          ...current,
          sequence: Math.max(current.sequence, sequence),
          playbooks: [copy, ...current.playbooks],
          executions: { ...current.executions, [copy.id]: buildExecutions(copy) },
        }))
        return copy
      },

      remove: (playbookId) => {
        setState((current) => {
          const executions = { ...current.executions }
          delete executions[playbookId]
          return {
            ...current,
            playbooks: current.playbooks.filter((item) => item.id !== playbookId),
            executions,
          }
        })
      },

      save: (playbookId, draft, note, author) => {
        const playbook = find(playbookId)
        if (!playbook) return null
        const version = bumpVersion(playbook.version)
        setState((current) => ({
          ...current,
          playbooks: current.playbooks.map((item) =>
            item.id === playbookId
              ? {
                  ...item,
                  kpis: draft.kpis,
                  frequency: draft.frequency,
                  alertThresholdPct: draft.alertThresholdPct,
                  yaml: draft.yaml,
                  savedYaml: draft.yaml,
                  version,
                  modifiedDate: 'Just now',
                  versions: [{ version, date: 'Just now', note, author, snapshot: draft.yaml }, ...item.versions],
                }
              : item
          ),
        }))
        return version
      },

      setChat: (playbookId, chat) => {
        setState((current) => ({
          ...current,
          playbooks: current.playbooks.map((item) => (item.id === playbookId ? { ...item, chat } : item)),
        }))
      },

      sendAction: ({ playbookId, executionId, findingIndex, request }) => {
        const channels = ACTION_CHANNELS.filter((channel) => request.channels.includes(channel.key)).map(
          (channel) => channel.label
        )
        const recipients = request.recipients.join(', ')
        const gaps = [activityGap(), activityGap()]
        setState((current) =>
          patchExecution(current, playbookId, executionId, (execution) =>
            appendActivity(
              {
                ...execution,
                actioned: execution.actioned.includes(findingIndex)
                  ? execution.actioned
                  : [...execution.actioned, findingIndex],
              },
              [
                { text: `${reviewer} reviewed the recommendation.`, tone: 'neutral' },
                { text: `Notification sent to ${recipients} via ${channels.join(', ')}.`, tone: 'success' },
              ],
              gaps
            )
          )
        )
        const first = request.recipients[0]
        window.setTimeout(() => {
          const gap = activityGap()
          setState((current) =>
            patchExecution(current, playbookId, executionId, (execution) =>
              appendActivity(execution, [{ text: `Notification opened by ${first}.`, tone: 'neutral' }], [gap])
            )
          )
        }, 2600)
        window.setTimeout(() => {
          const gap = activityGap()
          setState((current) =>
            patchExecution(current, playbookId, executionId, (execution) =>
              appendActivity(
                execution,
                [{ text: 'Comment received: “On it — checking with the team now.”', tone: 'success' }],
                [gap]
              )
            )
          )
        }, 4200)
      },
    }
  }, [state, actor])

  return <PlaybookStoreContext.Provider value={store}>{children}</PlaybookStoreContext.Provider>
}

export function usePlaybookStore(): PlaybookStore {
  const store = useContext(PlaybookStoreContext)
  if (!store) {
    throw new Error('usePlaybookStore requires PlaybookStoreProvider; render it inside the playbooks layout.')
  }
  return store
}
