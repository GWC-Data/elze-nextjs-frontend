import View from '@/views/platform/CompanyDetailPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="companies/:companyId" home="/platform" permission={"company.read"} abilities={PAGE_ABILITIES.CompanyDetailPage}>
      <View />
    </ServerRoute>
  )
}
