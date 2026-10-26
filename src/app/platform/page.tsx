import View from '@/views/OverviewPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute home="/platform" abilities={PAGE_ABILITIES.OverviewPage}>
      <View />
    </ServerRoute>
  )
}
