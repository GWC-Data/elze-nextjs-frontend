import View from '@/views/credits/PlatformCreditsPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="credits" home="/platform" permission={"credits.allocate"} abilities={PAGE_ABILITIES.PlatformCreditsPage}>
      <View />
    </ServerRoute>
  )
}
