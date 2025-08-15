import { NextRequest, NextResponse } from 'next/server'
import { insertOrder, getOrders, updateOrder } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    console.log('=== MANUAL WEBHOOK TEST START ===')
    
    // Create a test order with complete customer data
    const testOrderData = {
      id: 999999999,
      name: "#TEST-WEBHOOK-999999999",
      email: "test@webhook.com",
      created_at: new Date().toISOString(),
      total_price: "150.00",
      line_items: [
        {
          id: 1,
          name: "Test Product - Test Variant",
          price: "150.00",
          title: "Test Product",
          quantity: 1
        }
      ],
      shipping_address: {
        name: "Test Customer Full Name",
        first_name: "Test",
        last_name: "Customer",
        phone: "+216 22 458 624",
        address1: "123 Test Street",
        address2: "Apt 4B",
        city: "Test City",
        province: "Test Province",
        zip: "1000",
        country: "Tunisia",
        country_code: "TN"
      },
      billing_address: {
        name: "Test Customer Full Name",
        first_name: "Test",
        last_name: "Customer",
        phone: "+216 22 458 624",
        address1: "123 Test Street",
        address2: "Apt 4B",
        city: "Test City",
        province: "Test Province",
        zip: "1000",
        country: "Tunisia",
        country_code: "TN"
      },
      customer: {
        id: 999999999,
        first_name: "Test",
        last_name: "Customer",
        email: "test@webhook.com",
        phone: "+216 22 458 624",
        verified_email: true,
        state: "enabled"
      },
      tags: "test,webhook,manual",
      fulfillment_status: "unfulfilled",
      financial_status: "paid",
      note: "Test order created via manual webhook test"
    }

    console.log('Test order data:', JSON.stringify(testOrderData, null, 2))

    // Check if test order already exists
    console.log('Checking if test order exists...')
    const existingOrders = await getOrders()
    const orderExists = existingOrders.some(order => order.id === testOrderData.id)
    console.log('Test order exists:', orderExists)

    if (!orderExists) {
      // Insert new test order
      console.log('Mapping test order to database format...')
      const order = mapShopifyOrderToOrder(testOrderData)
      console.log('Mapped order:', JSON.stringify(order, null, 2))
      
      console.log('Inserting test order...')
      await insertOrder(order)
      console.log('✅ Test order inserted successfully!')
    } else {
      // Update existing test order
      console.log('Updating existing test order...')
      const order = mapShopifyOrderToOrder(testOrderData)
      const updatedAt = new Date().toISOString()
      await updateOrder(order, updatedAt)
      console.log('✅ Test order updated successfully!')
    }

    // Verify the order was saved correctly
    console.log('Verifying saved order...')
    const savedOrders = await getOrders()
    const savedOrder = savedOrders.find(order => order.id === testOrderData.id)
    
    const verification = {
      orderSaved: !!savedOrder,
      customerData: savedOrder ? {
        customer_first_name: savedOrder.customer?.first_name,
        customer_last_name: savedOrder.customer?.last_name,
        customer_phone: savedOrder.customer?.phone,
        customer_email: savedOrder.customer?.email,
        shipping_name: savedOrder.shipping_address?.name,
        shipping_phone: savedOrder.shipping_address?.phone,
        shipping_address1: savedOrder.shipping_address?.address1,
        shipping_city: savedOrder.shipping_address?.city,
        shipping_province: savedOrder.shipping_address?.province,
        shipping_zip: savedOrder.shipping_address?.zip,
        email: savedOrder.email
      } : null
    }

    console.log('Verification result:', JSON.stringify(verification, null, 2))
    console.log('=== MANUAL WEBHOOK TEST END ===')

    return NextResponse.json({ 
      success: true,
      message: 'Manual webhook test completed',
      orderId: testOrderData.id,
      orderExists: orderExists,
      verification: verification
    })
  } catch (error) {
    console.error('=== MANUAL WEBHOOK TEST ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('=== MANUAL WEBHOOK TEST ERROR END ===')
    
    return NextResponse.json(
      { error: 'Failed to process manual webhook test', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 