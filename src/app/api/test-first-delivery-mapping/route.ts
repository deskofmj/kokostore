import { NextRequest, NextResponse } from 'next/server'
import { sendOrderToFirstDelivery } from '@/lib/first-delivery'
import { getSupabaseClient } from '@/lib/supabase'
import { validateOrderForFirstDelivery } from '@/lib/data-mapping'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get the order from Supabase
    const supabase = getSupabaseClient()
    const { data: order, error } = await supabase
      .from('kokostore_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found', details: error?.message },
        { status: 404 }
      )
    }

    // Get the mapped data to show what's being sent to First Delivery
    const validation = validateOrderForFirstDelivery(order)
    
    // Testing First Delivery mapping for order

    // Send to First Delivery
    const firstDeliveryResponse = await sendOrderToFirstDelivery(order)
    
    return NextResponse.json({
      success: true,
      orderId,
      orderDetails: {
        id: order.id,
        name: order.name,
        postalCode: order.shipping_address?.zip,
        province: order.shipping_address?.province,
        city: order.shipping_address?.city,
        address: order.shipping_address?.address1,
        address2: order.shipping_address?.address2,
        customerName: order.shipping_address?.name,
        phone: order.shipping_address?.phone
      },
      firstDeliveryMappedData: validation.mappedData,
      firstDeliveryResponse,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error testing First Delivery mapping:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test First Delivery mapping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
