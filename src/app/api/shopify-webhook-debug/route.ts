import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())
    
    console.log('=== WEBHOOK DEBUG RECEIVED ===')
    console.log('Headers:', JSON.stringify(headers, null, 2))
    console.log('Body length:', body.length)
    console.log('Raw body:', body)
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(body)
      console.log('Parsed JSON:', JSON.stringify(data, null, 2))
    } catch (e) {
      console.log('Failed to parse as JSON:', e)
    }
    
    console.log('=== WEBHOOK DEBUG END ===')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook debug received',
      bodyLength: body.length,
      headersCount: Object.keys(headers).length
    })
  } catch (error) {
    console.error('Error in webhook debug:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 