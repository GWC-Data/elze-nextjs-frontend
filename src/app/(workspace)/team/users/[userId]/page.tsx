import View from '@/views/PersonPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/team/users/:userId" home="/workspace" permission={"user.read"} abilities={PAGE_ABILITIES.PersonPage}>
      <View scope="team" />
    </ServerRoute>
  )
}
