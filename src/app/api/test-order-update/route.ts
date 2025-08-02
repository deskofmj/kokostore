import { NextRequest, NextResponse } from 'next/server'
import { getOrders, updateOrder } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const orders = await getOrders()
    const order = orders.find(o => o.id === orderId)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Simulate an updated order from Shopify
    const updatedOrder = {
      ...order,
      note: order.note ? `${order.note} [Updated via webhook]` : 'Updated via webhook',
      total_price: (order.total_price + 1).toString(), // Simulate a price change
    }

    // Update the order
    await updateOrder(mapShopifyOrderToOrder(updatedOrder as any), new Date().toISOString())
    
    return NextResponse.json({ 
      success: true,
      message: 'Order updated successfully',
      orderId
    })
  } catch (error) {
    console.error('Error testing order update:', error)
    return NextResponse.json(
      { error: 'Failed to test order update' },
      { status: 500 }
    )
  }
} 