import View from '@/views/platform/CompaniesPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="companies" home="/platform" permission={"company.read"} abilities={PAGE_ABILITIES.CompaniesPage}>
      <View />
    </ServerRoute>
  )
}
