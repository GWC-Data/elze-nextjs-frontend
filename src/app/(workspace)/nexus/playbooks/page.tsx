'use client'

import View from '@/views/nexus/NexusPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/nexus/playbooks" home="/workspace">
      <View />
    </RouteView>
  )
}
