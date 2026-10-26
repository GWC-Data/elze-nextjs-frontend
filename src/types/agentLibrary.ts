export interface AgentKnowledgeRef {
  contextVersionId: string
  connectionId: string
  connectionName: string
  name: string
  label: string
  version: number
}

export type AgentScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly'

export interface AgentSchedule {
  enabled: boolean
  frequency: AgentScheduleFrequency
  time: string
  timezone: string
  daysOfWeek?: number[]
  dayOfMonth?: number
  date?: string
  prompt: string
  recipientEmail?: string
}

export interface LibraryAgent {
  id: string
  name: string
  description: string
  role: string
  instructions: string
  knowledge: AgentKnowledgeRef[]
  schedule: AgentSchedule | null
  ownerId?: string | null
  createdAt: string
  updatedAt: string
}

export interface LibraryAgentInput {
  name: string
  description: string
  role: string
  instructions: string
  knowledge: AgentKnowledgeRef[]
  ownerId?: string
}

export interface LibraryChatSession {
  id: string
  title: string
  updatedAt: string
}
