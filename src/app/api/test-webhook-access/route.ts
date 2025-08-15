import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: 'Webhook endpoint is accessible without authentication',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const data = body ? JSON.parse(body) : {}
    
    return NextResponse.json({ 
      success: true,
      message: 'Webhook POST endpoint is accessible without authentication',
      receivedData: data,
      timestamp: new Date().toISOString()
    })
  } catch {
    return NextResponse.json({ 
      success: false,
      error: 'Invalid JSON in request body',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
} 