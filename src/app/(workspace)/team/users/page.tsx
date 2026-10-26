import View from '@/views/PeoplePage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/team/users" home="/workspace" permission={"user.read"} abilities={PAGE_ABILITIES.PeoplePage}>
      <View scope="team" />
    </ServerRoute>
  )
}
