import View from '@/views/AuditLogPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/activity" home="/workspace" abilities={PAGE_ABILITIES.AuditLogPage}>
      <View />
    </ServerRoute>
  )
}
