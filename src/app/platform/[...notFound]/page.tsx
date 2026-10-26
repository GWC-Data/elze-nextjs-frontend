import View from '@/views/NotFoundPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute abilities={PAGE_ABILITIES.NotFoundPage}>
      <View />
    </ServerRoute>
  )
}
