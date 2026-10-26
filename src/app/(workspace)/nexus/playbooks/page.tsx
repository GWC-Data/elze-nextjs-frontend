import View from '@/views/nexus/NexusPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="/nexus/playbooks" home="/workspace">
      <View />
    </ServerRoute>
  )
}
