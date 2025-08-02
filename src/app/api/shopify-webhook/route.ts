import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/shopify'
import { insertOrder, getOrders, updateOrder } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET!

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      )
    }

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(body, signature, webhookSecret)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const data = JSON.parse(body)
    const shopifyOrder = data

    // Check if order already exists
    const existingOrders = await getOrders()
    const orderExists = existingOrders.some(order => order.id === shopifyOrder.id)

    if (!orderExists) {
      // Insert new order
      const order = mapShopifyOrderToOrder(shopifyOrder)
      await insertOrder(order)
    } else {
      // Update existing order
      const order = mapShopifyOrderToOrder(shopifyOrder)
      await updateOrder(order, new Date().toISOString())
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing Shopify webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
} 