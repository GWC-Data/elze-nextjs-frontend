import { filled } from '@/components/common/metadata-lakehouse/business-layer/businessLayerModel'
import type { BusinessLayer } from '@/types/metadataLakehouse'

const INSTRUCTIONS = [
  'Apply the business context below to this context layer. The people who own this data wrote it, so treat it as authoritative business knowledge.',
  'Do not re-extract any dataset. Update the facts that already exist and add what is missing:',
  "- use each dataset overview for that table's business description, what one row represents and the meaning of its columns;",
  '- record the business terms the overviews define in the glossary, and the measures they describe as metrics with their calculation;',
  '- use the overviews together to understand what the organization does and how it uses this data.',
  'Where the data contradicts this context, keep what the data shows and note the difference.',
].join('\n')

export function composeBusinessBrief(
  layer: BusinessLayer,
  {
    organizationName,
    tables,
  }: { organizationName: string | null; tables: { id: string; name: string }[] }
): string {
  const datasets = tables
    .filter((t) => filled(layer.tables[t.id]))
    .map((t) => `### ${t.name} (dataset id "${t.id}")\n${layer.tables[t.id].trim()}`)

  if (datasets.length === 0) return ''
  const organization = organizationName ? `Organization: ${organizationName}\n\n` : ''
  return `${INSTRUCTIONS}\n\n${organization}## Dataset overviews\n\n${datasets.join('\n\n')}`
}
