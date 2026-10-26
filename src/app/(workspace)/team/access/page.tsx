import View from '@/views/workspace/AccessPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/team/access" home="/workspace" permission={"access.read"} abilities={PAGE_ABILITIES.AccessPage}>
      <View />
    </ServerRoute>
  )
}
