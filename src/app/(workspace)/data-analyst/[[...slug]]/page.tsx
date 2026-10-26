import View from '@/views/agent/DataAnalystPage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/data-analyst/:connectionId?/:sessionId?" home="/workspace" permission={["analyst.use", "playbook.run"]} abilities={PAGE_ABILITIES.DataAnalystPage}>
      <View />
    </ServerRoute>
  )
}
