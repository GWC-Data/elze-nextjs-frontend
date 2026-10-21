'use client'

import View from '@/views/workspace/GroupsPage'
import { RouteView } from '@/router/RouteView'

export default function Page() {
  return (
    <RouteView routePath="/team/groups" home="/workspace" permission={"group.read"}>
      <View />
    </RouteView>
  )
}
