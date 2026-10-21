'use client'

import View from '@/views/PeoplePage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="users" home="/platform" permission={"user.read"}>
      <View scope="platform" />
    </RouteView>
  )
}
