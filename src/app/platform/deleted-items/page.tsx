import View from '@/views/DeletedItemsPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="deleted-items" home="/platform" permission={"delete.permanent"} abilities={PAGE_ABILITIES.DeletedItemsPage}>
      <View />
    </ServerRoute>
  )
}
