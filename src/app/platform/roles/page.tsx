import View from '@/views/platform/RolesPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="roles" home="/platform" permission={"role.read"} abilities={PAGE_ABILITIES.RolesPage}>
      <View />
    </ServerRoute>
  )
}
