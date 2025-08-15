import { NextRequest, NextResponse } from 'next/server'
import { insertOrder, getOrders } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    // Create a test order similar to what Shopify would send
    const testShopifyOrder = {
      id: Date.now(), // Use timestamp as unique ID
      name: `#TEST-${Date.now()}`,
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      total_price: '100.00',
      line_items: [
        {
          id: 1,
          title: 'Test Product',
          name: 'Test Product - Test Variant',
          price: '100.00',
          quantity: 1
        }
      ],
      shipping_address: {
        name: 'Test Customer',
        address1: '123 Test Street',
        city: 'Test City',
        province: 'Test Province',
        zip: '1000',
        country: 'Tunisia',
        phone: '123456789'
      },
      billing_address: {
        name: 'Test Customer',
        address1: '123 Test Street',
        city: 'Test City',
        province: 'Test Province',
        zip: '1000',
        country: 'Tunisia',
        phone: '123456789'
      },
      tags: 'test',
      fulfillment_status: 'unfulfilled',
      financial_status: 'paid',
      note: 'Test order from manual webhook test',
      customer: {
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@example.com',
        phone: '123456789'
      }
    }

    console.log('=== Manual Webhook Test ===')
    console.log('Test order:', testShopifyOrder)

    // Check if order already exists
    const existingOrders = await getOrders()
    const orderExists = existingOrders.some(order => order.id === testShopifyOrder.id)
    
    if (orderExists) {
      return NextResponse.json({
        success: false,
        error: 'Test order already exists',
        orderId: testShopifyOrder.id
      })
    }

    // Insert the test order
    const order = mapShopifyOrderToOrder(testShopifyOrder)
    await insertOrder(order)
    
    console.log('✅ Test order inserted successfully')

    return NextResponse.json({
      success: true,
      message: 'Test order created successfully',
      orderId: testShopifyOrder.id,
      orderName: testShopifyOrder.name
    })

  } catch (error) {
    console.error('❌ Error in manual webhook test:', error)
    return NextResponse.json(
      { error: 'Failed to create test order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 