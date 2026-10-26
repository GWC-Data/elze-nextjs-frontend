import View from '@/views/AuditLogPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="/activity" home="/workspace">
      <View />
    </ServerRoute>
  )
}
