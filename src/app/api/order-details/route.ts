import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('kokostore_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Error fetching order details:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order details' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Map the database data to the expected Order interface
    const mappedOrder = {
      id: data.id,
      name: data.name || `Order #${data.id}`,
      email: data.email || '',
      created_at: data.created_at || data.created_at_db || new Date().toISOString(),
      total_price: data.total_price || 0,
      line_items: Array.isArray(data.line_items) ? data.line_items : [],
      shipping_address: data.shipping_address || null,
      billing_address: data.billing_address || null,
      tags: data.tags || '',
      fulfillment_status: data.fulfillment_status || 'unfulfilled',
      financial_status: data.financial_status || 'paid',
      note: data.note || '',
      customer: data.customer || null,
      parcel_status: (() => {
        const status = data.parcel_status || 'Not sent'
        if (status === 'Not sent' || status === 'Sent to First Delivery' || status === 'Failed') {
          return status
        }
        return 'Not sent'
      })(),
      first_delivery_response: data.first_delivery_response || null,
      created_at_db: data.created_at_db || new Date().toISOString(),
      updated_at: data.updated_at || null,
      updated_in_shopify: data.updated_in_shopify || false,
      raw: data.raw || null,
      shop_domain: data.shop_domain || null
    }

    return NextResponse.json({ 
      order: mappedOrder,
      message: 'Order details fetched successfully'
    })
  } catch (error) {
    console.error('Error in order details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
