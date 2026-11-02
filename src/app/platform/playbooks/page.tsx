import View from '@/views/playbooks/PlaybooksPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="playbooks" home="/platform" permission={"playbook.read"}>
      <View />
    </ServerRoute>
  )
}
