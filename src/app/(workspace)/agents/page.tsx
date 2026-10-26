import View from '@/views/agent/AgentLibraryPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/agents" home="/workspace" permission={"agent.read"} abilities={PAGE_ABILITIES.AgentLibraryPage}>
      <View />
    </ServerRoute>
  )
}
