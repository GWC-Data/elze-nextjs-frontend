'use client'

import View from '@/views/platform/PlatformSettingsPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="settings" home="/platform">
      <View />
    </RouteView>
  )
}
