import type { NextRequest } from 'next/server'
import { proxyAuth } from '@/server/authProxy'

export function GET(request: NextRequest) {
  return proxyAuth(request, 'reset-password')
}

export function POST(request: NextRequest) {
  return proxyAuth(request, 'reset-password')
}
