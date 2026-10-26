import type { NextRequest } from 'next/server'
import { proxyAuth } from '@/server/authProxy'

export function POST(request: NextRequest) {
  return proxyAuth(request, 'change-password')
}
