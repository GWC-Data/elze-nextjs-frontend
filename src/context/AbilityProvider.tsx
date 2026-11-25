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
  const grantedKey = granted.join('\n')
  const declaredKey = declared ? declared.join('\n') : null
  const value = useMemo(
    () => ({
      granted: new Set(grantedKey ? grantedKey.split('\n') : []),
      declared: declaredKey === null ? null : new Set(declaredKey ? declaredKey.split('\n') : []),
    }),
    [grantedKey, declaredKey]
  )
  return <AbilityContext.Provider value={value}>{children}</AbilityContext.Provider>
}
