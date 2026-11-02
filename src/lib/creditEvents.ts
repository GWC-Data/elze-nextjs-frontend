export const CREDIT_USE_EVENT = 'elze:credit-use'

const BILLABLE_PATH = /\/(context-layer|description-editor|data-analyst)\/sessions\/[^/]+\/messages$/

export function isBillableAgentCall(path: string, method: string | undefined): boolean {
  return (method ?? 'GET').toUpperCase() === 'POST' && BILLABLE_PATH.test(path.split('?')[0])
}

export function announceCreditUse(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CREDIT_USE_EVENT))
}
