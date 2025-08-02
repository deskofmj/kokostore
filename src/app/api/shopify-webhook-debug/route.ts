import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/shopify'
import { insertOrder, getOrders, updateOrder } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  const debugLog: string[] = []
  
  try {
    debugLog.push('1. Starting webhook processing')
    
    const body = await request.text()
    debugLog.push(`2. Body received, length: ${body.length}`)
    
    const signature = request.headers.get('x-shopify-hmac-sha256')
    debugLog.push(`3. Signature present: ${!!signature}`)
    
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET
    debugLog.push(`4. Webhook secret present: ${!!webhookSecret}`)

    if (!signature) {
      debugLog.push('ERROR: Missing webhook signature')
      return NextResponse.json(
        { error: 'Missing webhook signature', debug: debugLog },
        { status: 401 }
      )
    }

    if (!webhookSecret) {
      debugLog.push('ERROR: Missing webhook secret')
      return NextResponse.json(
        { error: 'Missing webhook secret', debug: debugLog },
        { status: 500 }
      )
    }

    // Verify webhook signature
    debugLog.push('5. Attempting signature verification')
    const isValid = await verifyWebhookSignature(body, signature, webhookSecret)
    debugLog.push(`6. Signature valid: ${isValid}`)
    
    if (!isValid) {
      debugLog.push('ERROR: Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid webhook signature', debug: debugLog },
        { status: 401 }
      )
    }

    debugLog.push('7. Parsing JSON body')
    const data = JSON.parse(body)
    const shopifyOrder = data
    debugLog.push(`8. Order ID: ${shopifyOrder.id}`)

    // Check if order already exists
    debugLog.push('9. Fetching existing orders')
    const existingOrders = await getOrders()
    debugLog.push(`10. Found ${existingOrders.length} existing orders`)
    
    const orderExists = existingOrders.some(order => order.id === shopifyOrder.id)
    debugLog.push(`11. Order exists: ${orderExists}`)

    if (!orderExists) {
      // Insert new order
      debugLog.push('12. Attempting to insert new order')
      const order = mapShopifyOrderToOrder(shopifyOrder)
      await insertOrder(order)
      debugLog.push('13. Order inserted successfully')
    } else {
      // Update existing order
      debugLog.push('12. Attempting to update existing order')
      const order = mapShopifyOrderToOrder(shopifyOrder)
      await updateOrder(order, new Date().toISOString())
      debugLog.push('13. Order updated successfully')
    }

    debugLog.push('14. Webhook processing completed successfully')
    return NextResponse.json({ 
      success: true, 
      message: orderExists ? 'Order updated' : 'Order inserted',
      orderId: shopifyOrder.id,
      debug: debugLog
    })
  } catch (error) {
    debugLog.push(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.error('Error processing Shopify webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error', debug: debugLog },
      { status: 500 }
    )
  }
} 