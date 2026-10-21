'use client'

import View from '@/views/DashboardPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="dashboards/:dashboardId" home="/platform" permission={"dashboard.read"}>
      <View />
    </RouteView>
  )
}
