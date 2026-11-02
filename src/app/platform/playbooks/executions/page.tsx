import View from '@/views/playbooks/PlaybookExecutionsPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="playbooks/executions" home="/platform" permission={"playbook.read"}>
      <View />
    </ServerRoute>
  )
}
