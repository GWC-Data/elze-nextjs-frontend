import type { NextRequest } from 'next/server'
import { proxyAgentRequest } from '@/server/adkProxy'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  return proxyAgentRequest(request)
}

export function HEAD(request: NextRequest) {
  return proxyAgentRequest(request)
}

export function POST(request: NextRequest) {
  return proxyAgentRequest(request)
}

export function PUT(request: NextRequest) {
  return proxyAgentRequest(request)
}

export function PATCH(request: NextRequest) {
  return proxyAgentRequest(request)
}

export function DELETE(request: NextRequest) {
  return proxyAgentRequest(request)
}
