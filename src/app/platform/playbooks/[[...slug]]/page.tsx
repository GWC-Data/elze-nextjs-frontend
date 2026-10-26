import View from '@/views/agent/PlaybooksPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="playbooks/:connectionId?" home="/platform" permission={"playbook.read"} abilities={PAGE_ABILITIES.PlaybooksPage}>
      <View />
    </ServerRoute>
  )
}
