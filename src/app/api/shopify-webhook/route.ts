import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/shopify'
import { insertOrder, getOrders, updateOrder } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET

    console.log('Webhook processing started')
    console.log('Body length:', body.length)
    console.log('Signature present:', !!signature)
    console.log('Webhook secret present:', !!webhookSecret)

    if (!signature) {
      console.log('ERROR: Missing webhook signature')
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      )
    }

    if (!webhookSecret) {
      console.log('ERROR: Missing webhook secret')
      return NextResponse.json(
        { error: 'Missing webhook secret' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    console.log('Verifying signature...')
    const isValid = await verifyWebhookSignature(body, signature, webhookSecret)
    console.log('Signature valid:', isValid)
    
    if (!isValid) {
      console.log('ERROR: Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    console.log('Parsing JSON body...')
    const data = JSON.parse(body)
    const shopifyOrder = data
    console.log('Order ID:', shopifyOrder.id)

    // Check if order already exists
    console.log('Fetching existing orders...')
    const existingOrders = await getOrders()
    console.log('Found orders:', existingOrders.length)
    
    const orderExists = existingOrders.some(order => order.id === shopifyOrder.id)
    console.log('Order exists:', orderExists)

    if (!orderExists) {
      // Insert new order
      console.log('Inserting new order...')
      const order = mapShopifyOrderToOrder(shopifyOrder)
      await insertOrder(order)
      console.log('Order inserted successfully')
    } else {
      // Update existing order
      console.log('Updating existing order...')
      const order = mapShopifyOrderToOrder(shopifyOrder)
      await updateOrder(order, new Date().toISOString())
      console.log('Order updated successfully')
    }

    console.log('Webhook processing completed successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing Shopify webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 