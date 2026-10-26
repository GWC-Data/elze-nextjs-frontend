import type { NextRequest } from 'next/server'
import { proxyAuth } from '@/server/authProxy'

export function GET(request: NextRequest) {
  return proxyAuth(request, 'activation')
}

export function POST(request: NextRequest) {
  return proxyAuth(request, 'activation')
}
