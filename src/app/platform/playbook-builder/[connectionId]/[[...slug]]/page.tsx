'use client'

import View from '@/views/agent/PlaybookBuilderPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="playbook-builder/:connectionId/:sessionId?" home="/platform" permission={["playbook.create", "playbook.update"]}>
      <View />
    </RouteView>
  )
}
