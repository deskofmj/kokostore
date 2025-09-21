import { NextRequest, NextResponse } from 'next/server'
import { getFirstDeliveryOrderStatus } from '@/lib/first-delivery'

export async function POST(request: NextRequest) {
  try {
    const { trackingNumber } = await request.json()
    
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      )
    }

    
    const firstDeliveryResponse = await getFirstDeliveryOrderStatus(trackingNumber)
    
    return NextResponse.json({
      success: true,
      trackingNumber,
      firstDeliveryResponse,
      exists: firstDeliveryResponse.success && firstDeliveryResponse.status
    })
  } catch (error) {
    console.error('Error verifying First Delivery order:', error)
    return NextResponse.json(
      { 
        error: 'Failed to verify First Delivery order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
