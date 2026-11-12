import View from '@/views/workspace/GroupPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="groups/:groupId" home="/platform" permission={"group.read"} abilities={PAGE_ABILITIES.GroupPage}>
      <View />
    </ServerRoute>
  )
}
