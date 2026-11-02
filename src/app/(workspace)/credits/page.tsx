import View from '@/views/credits/CreditsPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/credits" home="/workspace" permission={"credits.manage"} abilities={PAGE_ABILITIES.CreditsPage}>
      <View />
    </ServerRoute>
  )
}
