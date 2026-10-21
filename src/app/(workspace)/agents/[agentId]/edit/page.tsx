'use client'

import View from '@/views/agent/LibraryAgentPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/agents/:agentId/edit" home="/workspace" permission={"agent.update"}>
      <View />
    </RouteView>
  )
}
