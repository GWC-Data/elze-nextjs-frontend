'use client'

import View from '@/views/agent/AgentLibraryPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/agents" home="/workspace" permission={"agent.read"}>
      <View />
    </RouteView>
  )
}
