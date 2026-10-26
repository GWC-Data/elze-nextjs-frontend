import View from '@/views/ProfilePage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="/settings/profile" home="/workspace">
      <View />
    </ServerRoute>
  )
}
