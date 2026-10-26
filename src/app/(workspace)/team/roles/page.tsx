import View from '@/views/workspace/CompanyRolesPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/team/roles" home="/workspace" permission={"role.read"} abilities={PAGE_ABILITIES.CompanyRolesPage}>
      <View />
    </ServerRoute>
  )
}
