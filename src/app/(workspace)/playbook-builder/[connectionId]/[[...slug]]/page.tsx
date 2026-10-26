import View from '@/views/agent/PlaybookBuilderPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="/playbook-builder/:connectionId/:sessionId?" home="/workspace" permission={["playbook.create", "playbook.update"]}>
      <View />
    </ServerRoute>
  )
}
