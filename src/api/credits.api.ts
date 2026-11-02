import { get, post, put } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { ListQuery, Paged } from '@/types/admin'
import type {
  CompanyCreditsPage,
  CreditActivityQuery,
  CreditAllocation,
  CreditEntry,
  CreditLimit,
  CreditMembers,
  CreditOverview,
  CreditRate,
  CreditStatus,
} from '@/types/credits'

const scoped = (companyId?: string) => (companyId ? { params: { companyId } } : undefined)

export function getMyCredits(companyId?: string): Promise<CreditStatus> {
  return get<CreditStatus>(endpoints.credits.me, scoped(companyId))
}

export function listCreditRates(): Promise<CreditRate[]> {
  return get<CreditRate[]>(endpoints.credits.rates)
}

export function updateCreditRate(action: string, credits: number): Promise<CreditRate> {
  return put<CreditRate>(endpoints.credits.rate(action), { credits })
}

export function listCompanyCredits(query: ListQuery): Promise<CompanyCreditsPage> {
  return get<CompanyCreditsPage>(endpoints.credits.companies, { params: query })
}

export function allocateCredits(
  companyId: string,
  body: { credits: number; note?: string | null }
): Promise<CreditAllocation> {
  return post<CreditAllocation>(endpoints.credits.allocations(companyId), body)
}

export function getCreditOverview(companyId?: string): Promise<CreditOverview> {
  return get<CreditOverview>(endpoints.credits.overview, scoped(companyId))
}

export function listCreditMembers(companyId?: string): Promise<CreditMembers> {
  return get<CreditMembers>(endpoints.credits.members, scoped(companyId))
}

export function setCreditLimit(userId: string, limit: number | null): Promise<CreditLimit> {
  return put<CreditLimit>(endpoints.credits.limit(userId), { limit })
}

export function listCreditActivity(query: CreditActivityQuery): Promise<Paged<CreditEntry>> {
  return get<Paged<CreditEntry>>(endpoints.credits.activity, { params: query })
}
