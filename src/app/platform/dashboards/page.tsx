import View from '@/views/DashboardsPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="dashboards" home="/platform" permission={"dashboard.read"} abilities={PAGE_ABILITIES.DashboardsPage}>
      <View />
    </ServerRoute>
  )
}
