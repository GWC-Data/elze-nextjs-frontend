import View from '@/views/workspace/GroupsPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/team/groups" home="/workspace" permission={"group.read"} abilities={PAGE_ABILITIES.GroupsPage}>
      <View />
    </ServerRoute>
  )
}
