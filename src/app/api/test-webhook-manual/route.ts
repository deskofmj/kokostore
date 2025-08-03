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

    console.log('=== MANUAL WEBHOOK TEST ===')
    console.log('Testing order update for ID:', orderId)

    // Get existing orders
    const orders = await getOrders()
    const existingOrder = orders.find(o => o.id.toString() === orderId.toString())
    
    if (!existingOrder) {
      return NextResponse.json({ 
        error: `Order ${orderId} not found`
      }, { status: 404 })
    }

    console.log('Found existing order:', existingOrder.name)

    // Simulate a Shopify order update (like what you edited)
    const mockShopifyOrderUpdate = {
      ...existingOrder,
      // Simulate the changes you made in Shopify
      note: existingOrder.note ? `${existingOrder.note} [Edited in Shopify]` : 'Edited in Shopify',
      total_price: (existingOrder.total_price + 0.01).toString(), // Small price change
      customer: {
        ...existingOrder.customer,
        first_name: existingOrder.customer?.first_name ? `${existingOrder.customer.first_name} [Edited]` : 'Edited Customer',
        last_name: existingOrder.customer?.last_name ? `${existingOrder.customer.last_name} [Edited]` : 'Edited'
      },
      shipping_address: {
        ...existingOrder.shipping_address,
        address1: existingOrder.shipping_address?.address1 ? `${existingOrder.shipping_address.address1} [Edited]` : 'Edited Address',
        phone: existingOrder.shipping_address?.phone ? `${existingOrder.shipping_address.phone} [Edited]` : '+216 22 458 624'
      }
    }

    console.log('Simulated Shopify order update:', {
      note: mockShopifyOrderUpdate.note,
      total_price: mockShopifyOrderUpdate.total_price,
      customer: mockShopifyOrderUpdate.customer,
      shipping_address: mockShopifyOrderUpdate.shipping_address
    })

    // Map to our format and update
    const order = mapShopifyOrderToOrder(mockShopifyOrderUpdate)
    const updatedAt = new Date().toISOString()
    
    await updateOrder(order, updatedAt)
    
    console.log('✅ Manual webhook test completed successfully')
    console.log('📝 Updated in Shopify flag set to true')
    console.log('🕒 Updated at:', updatedAt)
    
    return NextResponse.json({ 
      success: true,
      message: 'Order updated successfully via manual webhook test',
      orderId: orderId,
      updatedAt: updatedAt,
      changes: {
        note: mockShopifyOrderUpdate.note,
        total_price: mockShopifyOrderUpdate.total_price,
        customer: mockShopifyOrderUpdate.customer,
        shipping_address: mockShopifyOrderUpdate.shipping_address
      }
    })
  } catch (error) {
    console.error('❌ Error in manual webhook test:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 