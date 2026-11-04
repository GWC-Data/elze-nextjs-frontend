import type { NextRequest } from 'next/server'
import { proxyApiRequest } from '@/server/apiProxy'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  return proxyApiRequest(request)
}

export function HEAD(request: NextRequest) {
  return proxyApiRequest(request)
}

export function POST(request: NextRequest) {
  return proxyApiRequest(request)
}

export function PUT(request: NextRequest) {
  return proxyApiRequest(request)
}

export function PATCH(request: NextRequest) {
  return proxyApiRequest(request)
}

export function DELETE(request: NextRequest) {
  return proxyApiRequest(request)
}
