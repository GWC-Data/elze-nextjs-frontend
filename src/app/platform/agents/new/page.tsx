'use client'

import View from '@/views/agent/LibraryAgentPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="agents/new" home="/platform" permission={"agent.create"}>
      <View />
    </RouteView>
  )
}
