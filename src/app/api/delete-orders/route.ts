import { NextRequest, NextResponse } from 'next/server'
import { deleteOrders } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderIds } = await request.json()
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Delete the orders from the database
    await deleteOrders(orderIds)
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully deleted ${orderIds.length} order${orderIds.length > 1 ? 's' : ''}`
    })
  } catch (error) {
    console.error('Error deleting orders:', error)
    return NextResponse.json(
      { error: 'Failed to delete orders' },
      { status: 500 }
    )
  }
}
