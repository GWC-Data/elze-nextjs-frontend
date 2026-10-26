import { createContext, useCallback, useContext } from 'react'

export interface AbilityScope {
  granted: ReadonlySet<string>
  declared: ReadonlySet<string> | null
}

export const AbilityContext = createContext<AbilityScope | null>(null)

const warned = new Set<string>()

function warnUndeclared(scope: AbilityScope | null, permission: string): void {
  if (process.env.NODE_ENV === 'production' || warned.has(permission)) return
  if (scope?.declared && scope.declared.has(permission)) return
  warned.add(permission)
  console.warn(
    `can("${permission}") was checked outside the abilities this page declares; add it to PAGE_ABILITIES or it is always false.`
  )
}

export function useCan(): (permission: string) => boolean {
  const scope = useContext(AbilityContext)
  return useCallback(
    (permission: string) => {
      warnUndeclared(scope, permission)
      return Boolean(scope?.granted.has(permission))
    },
    [scope]
  )
}
