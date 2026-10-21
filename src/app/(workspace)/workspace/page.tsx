'use client'

import View from '@/views/OverviewPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/workspace" home="/workspace">
      <View />
    </RouteView>
  )
}
