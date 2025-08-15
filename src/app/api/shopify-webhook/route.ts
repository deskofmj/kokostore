import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/shopify'
import { insertOrder, getOrders, updateOrder } from '@/lib/supabase'
import { mapShopifyOrderToOrder } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET
    const topic = request.headers.get('x-shopify-topic-name')

    console.log('=== Shopify Webhook Processing ===')
    console.log('Topic:', topic)
    console.log('Body length:', body.length)
    console.log('Signature present:', !!signature)
    console.log('Webhook secret present:', !!webhookSecret)
    console.log('Raw body preview:', body.substring(0, 200) + '...')

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
    
    // Calculate the expected signature
    const crypto = await import('crypto')
    const hmac = crypto.createHmac('sha256', webhookSecret)
    hmac.update(body, 'utf8')
    const calculatedSignature = 'sha256=' + hmac.digest('hex')
    
    console.log('Received signature:', signature)
    console.log('Calculated signature:', calculatedSignature)
    console.log('Signatures match:', signature === calculatedSignature)
    
    if (signature !== calculatedSignature) {
      console.log('ERROR: Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }
    
    console.log('✅ Signature verification successful')

    console.log('Parsing JSON body...')
    const data = JSON.parse(body)
    const shopifyOrder = data
    console.log('Order ID:', shopifyOrder.id)
    console.log('Order Name:', shopifyOrder.name)
    console.log('Order Email:', shopifyOrder.email)
    console.log('Order Total Price:', shopifyOrder.total_price)
    console.log('Order Note:', shopifyOrder.note)
    console.log('Customer Name:', shopifyOrder.customer?.first_name, shopifyOrder.customer?.last_name)
    console.log('Shipping Address:', shopifyOrder.shipping_address?.address1)
    
    // Log detailed customer data for debugging
    console.log('=== DETAILED CUSTOMER DATA ===')
    console.log('Customer object:', JSON.stringify(shopifyOrder.customer, null, 2))
    console.log('Shipping address:', JSON.stringify(shopifyOrder.shipping_address, null, 2))
    console.log('Billing address:', JSON.stringify(shopifyOrder.billing_address, null, 2))
    console.log('=== END CUSTOMER DATA ===')

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
      console.log('✅ Order inserted successfully')
    } else {
      // Update existing order
      console.log('Updating existing order...')
      const order = mapShopifyOrderToOrder(shopifyOrder)
      const updatedAt = new Date().toISOString()
      await updateOrder(order, updatedAt)
      console.log('✅ Order updated successfully')
      console.log('📝 Updated in Shopify flag set to true')
      console.log('🕒 Updated at:', updatedAt)
      console.log('🔄 Order data updated with:', {
        name: order.name,
        email: order.email,
        total_price: order.total_price,
        note: order.note,
        customer: order.customer,
        shipping_address: order.shipping_address
      })
    }

    console.log('=== Webhook processing completed successfully ===')
    return NextResponse.json({ 
      success: true, 
      action: orderExists ? 'updated' : 'inserted',
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