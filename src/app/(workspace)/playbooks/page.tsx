import View from '@/views/playbooks/PlaybooksPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="/playbooks" home="/workspace" permission={"playbook.read"}>
      <View />
    </ServerRoute>
  )
}
