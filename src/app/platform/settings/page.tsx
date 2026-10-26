import View from '@/views/platform/PlatformSettingsPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="settings" home="/platform">
      <View />
    </ServerRoute>
  )
}
