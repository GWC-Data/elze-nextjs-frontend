'use client'

import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { AbilityContext } from '@/context/abilityContext'

export function AbilityProvider({
  granted,
  declared,
  children,
}: {
  granted: string[]
  declared?: string[]
  children: ReactNode
}) {
  const value = useMemo(
    () => ({ granted: new Set(granted), declared: declared ? new Set(declared) : null }),
    [granted, declared]
  )
  return <AbilityContext.Provider value={value}>{children}</AbilityContext.Provider>
}
