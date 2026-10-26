import { del, get, post } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { DeletedItem, DeletedItemType, ListQuery, Paged } from '@/types/admin'

export type DeletedItemsQuery = ListQuery & { type?: DeletedItemType; companyId?: string }

export function listDeletedItems(query: DeletedItemsQuery): Promise<Paged<DeletedItem>> {
  return get<Paged<DeletedItem>>(endpoints.deletedItems.root, { params: query })
}

export function restoreDeletedItem(item: DeletedItem): Promise<{ restored: true; item: DeletedItem }> {
  return post<{ restored: true; item: DeletedItem }>(endpoints.deletedItems.restore(item.type, item.id))
}

export function purgeDeletedItem(item: DeletedItem): Promise<{ deleted: true; permanent: true; item: DeletedItem }> {
  return del<{ deleted: true; permanent: true; item: DeletedItem }>(endpoints.deletedItems.one(item.type, item.id))
}
