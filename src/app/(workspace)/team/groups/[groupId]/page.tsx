import View from '@/views/workspace/GroupPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/team/groups/:groupId" home="/workspace" permission={"group.read"} abilities={PAGE_ABILITIES.GroupPage}>
      <View />
    </ServerRoute>
  )
}
