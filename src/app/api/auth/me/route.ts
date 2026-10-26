import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json(
    { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'The requested resource was not found.' } },
    { status: 404 }
  )
}
