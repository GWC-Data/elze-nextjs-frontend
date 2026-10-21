'use client'

import View from '@/views/agent/LibraryAgentChatPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/agents/:agentId/chat/:sessionId" home="/workspace" permission={"agent.read"}>
      <View />
    </RouteView>
  )
}
