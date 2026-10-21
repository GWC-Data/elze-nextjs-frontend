'use client'

import View from '@/views/agent/DataAnalystPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="data-analyst/:connectionId?/:sessionId?" home="/platform" permission={["analyst.use", "playbook.run"]}>
      <View />
    </RouteView>
  )
}
