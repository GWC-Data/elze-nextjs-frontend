'use client'

import View from '@/views/PeoplePage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/team/users" home="/workspace" permission={"user.read"}>
      <View scope="team" />
    </RouteView>
  )
}
