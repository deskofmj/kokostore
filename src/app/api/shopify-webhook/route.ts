import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/shopify'
import { insertOrder, orderExists, updateOrder } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET
    const topic = request.headers.get('x-shopify-topic-name')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      )
    }

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Missing webhook secret' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    const crypto = await import('crypto')
    const hmac = crypto.createHmac('sha256', webhookSecret)
    hmac.update(body, 'utf8')
    const calculatedSignature = hmac.digest('base64')
    
    if (signature !== calculatedSignature) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const data = JSON.parse(body)
    const shopifyOrder = data

    // Check if order already exists (efficient targeted query)
    const orderAlreadyExists = await orderExists(shopifyOrder.id)

    if (!orderAlreadyExists) {
      // Insert new order
      const order = mapShopifyOrderToOrder(shopifyOrder)
      await insertOrder(order)
    } else {
      // Update existing order
      const order = mapShopifyOrderToOrder(shopifyOrder)
      const updatedAt = new Date().toISOString()
      await updateOrder(order, updatedAt)
    }
    return NextResponse.json({ 
      success: true, 
      action: orderAlreadyExists ? 'updated' : 'inserted',
      orderId: shopifyOrder.id 
    })
  } catch (error) {
    console.error('❌ Error processing Shopify webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 