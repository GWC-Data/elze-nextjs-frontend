import View from '@/views/agent/LibraryAgentPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="agents/:agentId/edit" home="/platform" permission={"agent.update"} abilities={PAGE_ABILITIES.LibraryAgentPage}>
      <View />
    </ServerRoute>
  )
}
