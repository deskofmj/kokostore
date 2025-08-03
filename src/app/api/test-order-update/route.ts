import { NextRequest, NextResponse } from 'next/server'
import { getOrders, updateOrder } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body
    
    if (!orderId) {
      return NextResponse.json({ 
        error: 'orderId is required in request body'
      }, { status: 400 })
    }

    // Get existing orders
    const orders = await getOrders()
    const existingOrder = orders.find(o => o.id.toString() === orderId.toString())
    
    if (!existingOrder) {
      return NextResponse.json({ 
        error: `Order ${orderId} not found`
      }, { status: 404 })
    }

    // Simulate a Shopify order update
    const mockShopifyOrderUpdate = {
      ...existingOrder,
      // Simulate some changes
      note: existingOrder.note ? `${existingOrder.note} [Updated via webhook]` : 'Updated via webhook',
      total_price: (existingOrder.total_price + 1).toString(), // Simulate a price change
      shipping_address: {
        ...existingOrder.shipping_address,
        address1: `${existingOrder.shipping_address?.address1 || ''} [Updated]`
      }
    }

    // Map to our format and update
    const order = mapShopifyOrderToOrder(mockShopifyOrderUpdate)
    const updatedAt = new Date().toISOString()
    
    await updateOrder(order, updatedAt)
    
    console.log(`✅ Test order update completed for order ${orderId}`)
    console.log(`📝 Updated in Shopify flag set to true`)
    console.log(`🕒 Updated at: ${updatedAt}`)
    
    return NextResponse.json({ 
      success: true,
      message: 'Order updated successfully via webhook simulation',
      orderId: orderId,
      updatedAt: updatedAt,
      changes: {
        note: mockShopifyOrderUpdate.note,
        total_price: mockShopifyOrderUpdate.total_price,
        address: mockShopifyOrderUpdate.shipping_address?.address1
      }
    })
  } catch (error) {
    console.error('Error testing order update:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 