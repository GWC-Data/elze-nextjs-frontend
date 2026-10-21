'use client'

import View from '@/views/agent/PlaybooksPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="playbooks/:connectionId?" home="/platform" permission={"playbook.read"}>
      <View />
    </RouteView>
  )
}
