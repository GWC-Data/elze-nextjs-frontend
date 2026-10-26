import View from '@/views/workspace/CompanySettingsPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/settings/company" home="/workspace" permission={"company.read"} abilities={PAGE_ABILITIES.CompanySettingsPage}>
      <View />
    </ServerRoute>
  )
}
