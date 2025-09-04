import { NextResponse } from 'next/server'
import { getFirstDeliveryOrders } from '@/lib/first-delivery'

async function testFirstDeliveryConnection() {
  try {
    // Test connection by trying to get orders (limit 1 to minimize data transfer)
    const response = await getFirstDeliveryOrders(1, 1)
    
    return {
      connected: response.success,
      error: response.success ? undefined : response.error_message || 'Connection failed'
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function GET() {
  try {
    const status = await testFirstDeliveryConnection()
    
    return NextResponse.json({
      firstDelivery: status,
      current: status
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to check First Delivery status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
