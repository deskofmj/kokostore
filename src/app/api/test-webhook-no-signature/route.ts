import { NextRequest, NextResponse } from 'next/server'
import { insertOrder, getOrders, updateOrder } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    console.log('Received webhook body:', body.substring(0, 200) + '...')
    
    const data = JSON.parse(body)
    const shopifyOrder = data

    console.log('Processing order:', shopifyOrder.id)

    // Check if order already exists
    const existingOrders = await getOrders()
    const orderExists = existingOrders.some(order => order.id === shopifyOrder.id)

    console.log('Order exists:', orderExists)

    if (!orderExists) {
      // Insert new order
      console.log('Inserting new order')
      const order = mapShopifyOrderToOrder(shopifyOrder)
      await insertOrder(order)
      console.log('Order inserted successfully')
    } else {
      // Update existing order
      console.log('Updating existing order')
      const order = mapShopifyOrderToOrder(shopifyOrder)
      await updateOrder(order, new Date().toISOString())
      console.log('Order updated successfully')
    }

    return NextResponse.json({ 
      success: true,
      message: orderExists ? 'Order updated' : 'Order inserted',
      orderId: shopifyOrder.id
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 