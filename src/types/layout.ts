import { useOutletContext } from '@/lib/router'
import type { AccessibleDashboard } from '@/types/auth'

export interface AppData {
  dashboards: AccessibleDashboard[]
  reload: () => Promise<void>
}

export function useAppData(): AppData {
  return useOutletContext<AppData>()
}
