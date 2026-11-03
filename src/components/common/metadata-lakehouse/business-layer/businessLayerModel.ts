import type { BusinessLayer } from '@/types/metadataLakehouse'

export const LIMITS = {
  tableOverview: 2000,
} as const

export const EMPTY_LAYER: BusinessLayer = { tables: {} }

export function filled(value: string | undefined): boolean {
  return Boolean(value?.trim())
}
