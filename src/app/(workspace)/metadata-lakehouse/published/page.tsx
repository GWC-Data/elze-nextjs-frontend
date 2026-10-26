import View from '@/views/metadata-lakehouse/MetadataLakehousePage'
import { ServerRoute } from '@/server/ServerRoute'
import { PAGE_ABILITIES } from '@/constants/pageAbilities'

export default function Page() {
  return (
    <ServerRoute routePath="/metadata-lakehouse/published" home="/workspace" permission={"context.read"} abilities={PAGE_ABILITIES.MetadataLakehousePage}>
      <View view="published" />
    </ServerRoute>
  )
}
