import View from '@/views/AuditLogPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="audit" home="/platform">
      <View />
    </ServerRoute>
  )
}
