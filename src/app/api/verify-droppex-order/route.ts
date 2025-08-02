import { NextRequest, NextResponse } from 'next/server'
import { getDroppexPackage } from '@/lib/droppex'

export async function POST(request: NextRequest) {
  try {
    const { trackingNumber } = await request.json()
    
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      )
    }

    console.log(`Verifying Droppex order with tracking number: ${trackingNumber}`)
    
    const droppexResponse = await getDroppexPackage(trackingNumber)
    
    return NextResponse.json({
      success: true,
      trackingNumber,
      droppexResponse,
      exists: droppexResponse.success && droppexResponse.tracking_number
    })
  } catch (error) {
    console.error('Error verifying Droppex order:', error)
    return NextResponse.json(
      { 
        error: 'Failed to verify Droppex order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 