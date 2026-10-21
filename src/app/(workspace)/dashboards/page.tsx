'use client'

import View from '@/views/DashboardsPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/dashboards" home="/workspace" permission={"dashboard.read"}>
      <View />
    </RouteView>
  )
}
