import View from '@/views/DashboardPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="dashboards/:dashboardId" home="/platform" permission={"dashboard.read"} abilities={PAGE_ABILITIES.DashboardPage}>
      <View />
    </ServerRoute>
  )
}
