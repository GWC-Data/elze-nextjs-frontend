import View from '@/views/playbooks/PlaybookActionsPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="/playbooks/actions" home="/workspace" permission={"playbook.read"}>
      <View />
    </ServerRoute>
  )
}
