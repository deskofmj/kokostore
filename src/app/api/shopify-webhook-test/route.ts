import { NextRequest, NextResponse } from 'next/server'
import { insertOrder, getOrders } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK TEST START ===')
    
    const body = await request.text()
    console.log('Request body received:', body.substring(0, 200) + '...')
    
    const data = JSON.parse(body)
    const shopifyOrder = data
    console.log('Order ID:', shopifyOrder.id)
    console.log('Order Name:', shopifyOrder.name)
    console.log('Order Email:', shopifyOrder.email)

    // Check if order already exists
    console.log('Checking if order exists...')
    const existingOrders = await getOrders()
    const orderExists = existingOrders.some(order => order.id === shopifyOrder.id)
    console.log('Order exists:', orderExists)

    if (!orderExists) {
      // Insert new order
      console.log('Mapping Shopify order to database format...')
      const order = mapShopifyOrderToOrder(shopifyOrder)
      console.log('Inserting order...')
      await insertOrder(order)
      console.log('Order inserted successfully!')
    } else {
      console.log('Order already exists, skipping insertion')
    }

    console.log('=== WEBHOOK TEST END ===')
    return NextResponse.json({ 
      success: true,
      message: 'Order processed successfully',
      orderId: shopifyOrder.id,
      orderExists: orderExists
    })
  } catch (error) {
    console.error('=== WEBHOOK TEST ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('=== WEBHOOK TEST ERROR END ===')
    
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 