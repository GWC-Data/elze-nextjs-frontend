import View from '@/views/agent/LibraryAgentPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/agents/new" home="/workspace" permission={"agent.create"} abilities={PAGE_ABILITIES.LibraryAgentPage}>
      <View />
    </ServerRoute>
  )
}
