import { useState } from 'react'
import { notify } from '@/lib/notify'

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ATTACHMENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
]
const ATTACHMENT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.txt', '.csv', '.md', '.json']

export const ATTACHMENT_ACCEPT = [...ATTACHMENT_TYPES, ...ATTACHMENT_EXTENSIONS].join(',')

function attachable(file: File) {
  const name = file.name.toLowerCase()
  return ATTACHMENT_TYPES.includes(file.type) || ATTACHMENT_EXTENSIONS.some((extension) => name.endsWith(extension))
}

export function useAttachments() {
  const [files, setFiles] = useState<File[]>([])

  const add = (picked: FileList | null) => {
    if (!picked?.length) return
    const accepted: File[] = []
    for (const file of Array.from(picked)) {
      if (!attachable(file)) {
        notify.error(`${file.name} can't be attached.`, 'Use PDF, PNG, JPEG, GIF, WebP, TXT, CSV, MD or JSON.')
      } else if (file.size > MAX_ATTACHMENT_BYTES) {
        notify.error(`${file.name} is too large.`, 'The limit is 10 MB per file.')
      } else {
        accepted.push(file)
      }
    }
    setFiles((current) => [
      ...current,
      ...accepted.filter((file) => !current.some((item) => item.name === file.name && item.size === file.size)),
    ])
  }

  return {
    files,
    add,
    remove: (file: File) => setFiles((current) => current.filter((item) => item !== file)),
    clear: () => setFiles([]),
  }
}
