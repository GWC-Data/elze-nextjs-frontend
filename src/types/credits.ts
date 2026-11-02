import type { ListQuery, Paged } from '@/types/admin'

export type CreditAction = 'context.build' | 'context.chat' | 'analyst.question'

export type CreditEntryKind = 'allocation' | 'usage' | 'refund'

export interface CreditStatus {
  companyId: string | null
  balance: number | null
  limit: number | null
  used: number
  remaining: number | null
  available: number | null
  exempt: boolean
}

export interface CreditRate {
  action: CreditAction
  label: string
  description: string | null
  credits: number
  updatedAt: string
}

export interface CompanyCredits {
  id: string
  name: string
  slug: string
  active: boolean
  balance: number
  allocated: number
  used: number
  lastUsedAt: string | null
}

export interface CompanyCreditsPage extends Paged<CompanyCredits> {
  totals: { balance: number; allocated: number; used: number; companies: number }
}

export interface CreditAllocation {
  companyId: string
  credits: number
  balance: number
  entryId: string
}

export interface CreditOverview {
  companyId: string
  balance: number
  allocated: number
  used: number
  used30Days: number
  runs: number
  byAction: { action: CreditAction; label: string; credits: number; runs: number }[]
  daily: {
    days: string[]
    actions: { action: CreditAction; label: string }[]
    usage: { day: string; action: CreditAction; credits: number }[]
  }
}

export interface CreditMember {
  id: string
  name: string
  username: string
  email: string
  role: string | null
  status: string
  limit: number | null
  used: number
  remaining: number | null
}

export interface CreditMembers {
  items: CreditMember[]
}

export interface CreditLimit {
  userId: string
  limit: number | null
  used: number
  remaining: number | null
}

export interface CreditEntry {
  id: string
  kind: CreditEntryKind
  credits: number
  balanceAfter: number
  user: { id: string | null; name: string; email: string | null; platform: boolean } | null
  action: { key: CreditAction; label: string } | null
  context: { id: string; name: string | null } | null
  sessionId: string | null
  note: string | null
  refunded: boolean
  createdAt: string
}

export type CreditActivityQuery = ListQuery & {
  companyId?: string
  userId?: string
  kind?: CreditEntryKind
  action?: CreditAction
}
