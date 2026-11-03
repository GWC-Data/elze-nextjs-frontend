import { useEffect, useSyncExternalStore } from 'react'
import { getMyCredits, listCreditRates } from '@/api/credits.api'
import { CREDIT_USE_EVENT } from '@/lib/creditEvents'
import type { CreditAction, CreditRate, CreditStatus } from '@/types/credits'

export interface CreditSnapshot {
  status: CreditStatus | null
  rates: CreditRate[] | null
}

const EMPTY: CreditSnapshot = { status: null, rates: null }

let snapshot: CreditSnapshot = EMPTY
const listeners = new Set<() => void>()
let statusRequest: Promise<void> | null = null
let statusStale = false
let ratesRequest: Promise<void> | null = null

function publish(next: Partial<CreditSnapshot>) {
  snapshot = { ...snapshot, ...next }
  for (const listener of listeners) listener()
}

export function refreshCreditStatus(): Promise<void> {
  if (statusRequest) {
    statusStale = true
    return statusRequest
  }
  statusRequest = getMyCredits()
    .then(
      (status) => publish({ status }),
      () => undefined
    )
    .finally(() => {
      statusRequest = null
      if (statusStale) {
        statusStale = false
        void refreshCreditStatus()
      }
    })
  return statusRequest
}

export function refreshCreditRates(): Promise<void> {
  ratesRequest ??= listCreditRates()
    .then(
      (rates) => publish({ rates }),
      () => undefined
    )
    .finally(() => {
      ratesRequest = null
    })
  return ratesRequest
}

function onCreditUse() {
  void refreshCreditStatus()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    window.addEventListener(CREDIT_USE_EVENT, onCreditUse)
    window.addEventListener('focus', onCreditUse)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener(CREDIT_USE_EVENT, onCreditUse)
      window.removeEventListener('focus', onCreditUse)
    }
  }
}

export function useCredits(): CreditSnapshot {
  const current = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY
  )
  useEffect(() => {
    if (!snapshot.status) void refreshCreditStatus()
    if (!snapshot.rates) void refreshCreditRates()
  }, [])
  return current
}

const cents = (value: number) => Math.round(value * 100)

export interface CreditCheck {
  cost: number | null
  short: boolean
  reason: string | null
}

export function creditShortfall(status: CreditStatus | null, cost: number | null): string | null {
  if (!status || status.exempt || cost === null || cents(cost) <= 0 || status.available === null) return null
  if (cents(status.available) >= cents(cost)) return null
  if (status.remaining !== null && cents(status.remaining) < cents(cost) && cents(status.balance ?? 0) >= cents(cost)) {
    return 'You have reached your credit limit. A company admin can raise it.'
  }
  return 'Your company is out of credits. Ask the platform team to add more.'
}

export function useCreditCheck(action: CreditAction, runs = 1): CreditCheck {
  const { status, rates } = useCredits()
  const rate = rates?.find((entry) => entry.action === action)?.credits ?? null
  const cost = rate === null ? null : Math.round(rate * runs * 100) / 100
  const reason = creditShortfall(status, cost)
  return { cost, short: reason !== null, reason }
}
