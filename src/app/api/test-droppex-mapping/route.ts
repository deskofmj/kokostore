import { NextRequest, NextResponse } from 'next/server'
import { sendOrderToDroppex } from '@/lib/droppex'
import { getSupabaseClient } from '@/lib/supabase'
import { validateOrderForDroppex } from '@/lib/data-mapping'

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
      .from('salmacollection')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found', details: error?.message },
        { status: 404 }
      )
    }

    // Get the mapped data to show what's being sent to Droppex
    const validation = validateOrderForDroppex(order)
    
    console.log('Testing Droppex mapping for order:', {
      id: order.id,
      name: order.name,
      postalCode: order.shipping_address?.zip,
      province: order.shipping_address?.province,
      city: order.shipping_address?.city,
      address1: order.shipping_address?.address1,
      address2: order.shipping_address?.address2
    })

    console.log('Droppex mapped data:', validation.mappedData)

    // Send to Droppex
    const droppexResponse = await sendOrderToDroppex(order)
    
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
      droppexMappedData: validation.mappedData,
      droppexResponse,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error testing Droppex mapping:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test Droppex mapping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
