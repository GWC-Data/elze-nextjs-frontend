import 'server-only'

export function backendUrl(): string {
  const url = process.env.BACKEND_URL?.trim().replace(/\/+$/, '')
  if (!url) throw new Error('BACKEND_URL is not set: the Next.js server needs it to reach the backend.')
  return url
}
