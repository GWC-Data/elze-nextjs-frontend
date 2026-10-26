import View from '@/views/agent/LibraryAgentChatPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/agents/:agentId" home="/workspace" permission={"agent.read"} abilities={PAGE_ABILITIES.LibraryAgentChatPage}>
      <View />
    </ServerRoute>
  )
}
