import View from '@/views/ArchitecturePage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/architecture" home="/workspace" abilities={PAGE_ABILITIES.ArchitecturePage}>
      <View />
    </ServerRoute>
  )
}
