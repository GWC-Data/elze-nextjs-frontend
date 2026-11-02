import View from '@/views/playbooks/PlaybookEditorPage'
import { ServerRoute } from '@/server/ServerRoute'

export default function Page() {
  return (
    <ServerRoute routePath="/playbooks/:playbookId/edit" home="/workspace" permission={"playbook.read"}>
      <View />
    </ServerRoute>
  )
}
