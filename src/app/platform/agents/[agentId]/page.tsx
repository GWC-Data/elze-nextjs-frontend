'use client'

import View from '@/views/agent/LibraryAgentChatPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="agents/:agentId" home="/platform" permission={"agent.read"}>
      <View />
    </RouteView>
  )
}
