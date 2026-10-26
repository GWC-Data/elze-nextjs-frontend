import View from '@/views/PeoplePage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="users" home="/platform" permission={"user.read"} abilities={PAGE_ABILITIES.PeoplePage}>
      <View scope="platform" />
    </ServerRoute>
  )
}
