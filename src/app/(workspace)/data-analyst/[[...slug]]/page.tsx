'use client'

import View from '@/views/agent/DataAnalystPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/data-analyst/:connectionId?/:sessionId?" home="/workspace" permission={["analyst.use", "playbook.run"]}>
      <View />
    </RouteView>
  )
}
