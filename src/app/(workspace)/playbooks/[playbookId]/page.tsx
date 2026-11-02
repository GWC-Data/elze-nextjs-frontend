import View from '@/views/playbooks/PlaybookDetailPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="/playbooks/:playbookId" home="/workspace" permission={"playbook.read"}>
      <View />
    </ServerRoute>
  )
}
