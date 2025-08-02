import { NextRequest, NextResponse } from 'next/server'
import { getOrders, insertOrder } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function GET(request: NextRequest) {
  try {
    // Test database connection by fetching orders
    const orders = await getOrders()
    
    return NextResponse.json({ 
      success: true,
      message: 'Database connection successful',
      orderCount: orders.length,
      orders: orders.slice(0, 3) // Return first 3 orders for debugging
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testOrder } = body
    
    if (!testOrder) {
      return NextResponse.json({ 
        success: false,
        error: 'testOrder is required in request body'
      }, { status: 400 })
    }

    // Test inserting a mock order
    const mockShopifyOrder = {
      id: 999999,
      name: '#TEST-999999',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      total_price: '100.00',
      line_items: [],
      shipping_address: null,
      billing_address: null,
      tags: 'test',
      fulfillment_status: 'unfulfilled',
      financial_status: 'paid',
      note: 'Test order from API',
      customer: {
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@example.com'
      }
    }

    const order = mapShopifyOrderToOrder(mockShopifyOrder)
    await insertOrder(order)
    
    return NextResponse.json({ 
      success: true,
      message: 'Test order inserted successfully',
      orderId: mockShopifyOrder.id
    })
  } catch (error) {
    console.error('Test order insertion error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to insert test order'
    }, { status: 500 })
  }
} 